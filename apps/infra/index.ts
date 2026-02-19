import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const config = new pulumi.Config();

// Reference to the shared GKE infrastructure stack
const infraStackRef = config.require("infraStackRef");

// Docker images (set by GitHub Actions via `pulumi config set`)
const apiImage = config.require("apiImage");
const webImage = config.require("webImage");

// Scaling
const apiReplicas = config.getNumber("apiReplicas") ?? 1;
const webReplicas = config.getNumber("webReplicas") ?? 1;

// App URLs
const frontendUrl = config.get("frontendUrl") ?? "https://good-job.xyz";

// App secrets (stored encrypted in Pulumi Cloud)
const databaseUrl = config.requireSecret("databaseUrl");
const redisUrl = config.requireSecret("redisUrl");
const jwtSecret = config.requireSecret("jwtSecret");
const jwtRefreshSecret = config.requireSecret("jwtRefreshSecret");
const googleClientId = config.requireSecret("googleClientId");
const googleClientSecret = config.requireSecret("googleClientSecret");
const googleRedirectUri = config.requireSecret("googleRedirectUri");
const geminiApiKeys = config.requireSecret("geminiApiKeys");
const oauthTokenEncryptionKey = config.requireSecret("oauthTokenEncryptionKey");
const resendToken = config.getSecret("resendToken");
const adminEmail = config.getSecret("adminEmail");

// ---------------------------------------------------------------------------
// Stack Reference — pull GKE kubeconfig from gcp-infra
// ---------------------------------------------------------------------------
const infraStack = new pulumi.StackReference(infraStackRef);

// Full kubeconfig YAML exported by gcp-infra
const kubeconfig = infraStack.requireOutput("kubeconfigOutput") as pulumi.Output<string>;

// ---------------------------------------------------------------------------
// Kubernetes Provider
// ---------------------------------------------------------------------------
const k8sProvider = new k8s.Provider("gke-k8s", {
  kubeconfig: kubeconfig,
});

// ---------------------------------------------------------------------------
// Namespace
// ---------------------------------------------------------------------------
const namespace = new k8s.core.v1.Namespace(
  "apps-namespace",
  {
    metadata: { name: "apps" },
  },
  { provider: k8sProvider },
);

const ns = namespace.metadata.name;

// ---------------------------------------------------------------------------
// API — Secret
// ---------------------------------------------------------------------------
// Databases are accessed via Kubernetes internal DNS (same cluster):
//   postgresql.databases.svc.cluster.local:5432
//   redis-master.databases.svc.cluster.local:6379
const apiSecret = new k8s.core.v1.Secret(
  "api-secret",
  {
    metadata: {
      name: "api-secret",
      namespace: ns,
    },
    stringData: {
      DATABASE_URL: databaseUrl,
      REDIS_URL: redisUrl,
      JWT_SECRET: jwtSecret,
      JWT_REFRESH_SECRET: jwtRefreshSecret,
      GOOGLE_CLIENT_ID: googleClientId,
      GOOGLE_CLIENT_SECRET: googleClientSecret,
      GOOGLE_CALLBACK_URL: googleRedirectUri,
      GEMINI_API_KEYS: geminiApiKeys,
      OAUTH_TOKEN_ENCRYPTION_KEY: oauthTokenEncryptionKey,
      RESEND_TOKEN: resendToken ?? "",
      ADMIN_EMAIL: adminEmail ?? "",
    },
  },
  { provider: k8sProvider },
);

// ---------------------------------------------------------------------------
// API — Deployment
// ---------------------------------------------------------------------------
const apiDeployment = new k8s.apps.v1.Deployment(
  "api-deployment",
  {
    metadata: {
      name: "api",
      namespace: ns,
      labels: { app: "api" },
      annotations: {
        "pulumi.com/patchForce": "true",
      },
    },
    spec: {
      replicas: apiReplicas,
      selector: { matchLabels: { app: "api" } },
      template: {
        metadata: { labels: { app: "api" } },
        spec: {
          containers: [
            {
              name: "api",
              image: apiImage,
              ports: [{ containerPort: 3000 }],
              env: [
                { name: "NODE_ENV", value: "production" },
                { name: "APP_URL", value: frontendUrl },
                { name: "DEFAULT_MONTHLY_BUDGET", value: "1000" },
                { name: "DEFAULT_MIN_POINTS", value: "1" },
                { name: "DEFAULT_MAX_POINTS", value: "100" },
              ],
              envFrom: [
                { secretRef: { name: apiSecret.metadata.name } },
              ],
              resources: {
                requests: { cpu: "100m", memory: "256Mi" },
                limits: { cpu: "500m", memory: "512Mi" },
              },
              livenessProbe: {
                httpGet: { path: "/api", port: 3000 },
                initialDelaySeconds: 30,
                periodSeconds: 15,
                failureThreshold: 3,
              },
              readinessProbe: {
                httpGet: { path: "/api/ready", port: 3000 },
                initialDelaySeconds: 10,
                periodSeconds: 5,
                failureThreshold: 3,
              },
            },
          ],
        },
      },
    },
  },
  { provider: k8sProvider },
);

// ---------------------------------------------------------------------------
// API — Service (ClusterIP)
// ---------------------------------------------------------------------------
const apiService = new k8s.core.v1.Service(
  "api-service",
  {
    metadata: {
      name: "api",
      namespace: ns,
      labels: { app: "api" },
    },
    spec: {
      type: "ClusterIP",
      selector: { app: "api" },
      ports: [{ port: 3000, targetPort: 3000, name: "http" }],
    },
  },
  { provider: k8sProvider },
);

// ---------------------------------------------------------------------------
// Web — Deployment
// ---------------------------------------------------------------------------
const webDeployment = new k8s.apps.v1.Deployment(
  "web-deployment",
  {
    metadata: {
      name: "web",
      namespace: ns,
      labels: { app: "web" },
    },
    spec: {
      replicas: webReplicas,
      selector: { matchLabels: { app: "web" } },
      template: {
        metadata: { labels: { app: "web" } },
        spec: {
          containers: [
            {
              name: "web",
              image: webImage,
              ports: [{ containerPort: 80 }],
              resources: {
                requests: { cpu: "50m", memory: "64Mi" },
                limits: { cpu: "200m", memory: "128Mi" },
              },
              livenessProbe: {
                httpGet: { path: "/health", port: 80 },
                initialDelaySeconds: 10,
                periodSeconds: 15,
              },
              readinessProbe: {
                httpGet: { path: "/health", port: 80 },
                initialDelaySeconds: 5,
                periodSeconds: 5,
              },
            },
          ],
        },
      },
    },
  },
  { provider: k8sProvider },
);

// ---------------------------------------------------------------------------
// Web — Service (ClusterIP)
// ---------------------------------------------------------------------------
const webService = new k8s.core.v1.Service(
  "web-service",
  {
    metadata: {
      name: "web",
      namespace: ns,
      labels: { app: "web" },
    },
    spec: {
      type: "ClusterIP",
      selector: { app: "web" },
      ports: [{ port: 80, targetPort: 80, name: "http" }],
    },
  },
  { provider: k8sProvider },
);

// ---------------------------------------------------------------------------
// cert-manager — automatic TLS certificates from Let's Encrypt
// ---------------------------------------------------------------------------
const certManagerNs = new k8s.core.v1.Namespace(
  "cert-manager-namespace",
  {
    metadata: { name: "cert-manager" },
  },
  { provider: k8sProvider },
);

const certManager = new k8s.helm.v3.Release(
  "cert-manager",
  {
    name: "cert-manager",
    chart: "cert-manager",
    version: "1.17.1",
    namespace: certManagerNs.metadata.name,
    repositoryOpts: {
      repo: "https://charts.jetstack.io",
    },
    values: {
      crds: { enabled: true },
      resources: {
        requests: { cpu: "50m", memory: "64Mi" },
        limits: { cpu: "200m", memory: "256Mi" },
      },
    },
  },
  { provider: k8sProvider },
);

// ClusterIssuer for Let's Encrypt production
const letsEncryptIssuer = new k8s.apiextensions.CustomResource(
  "letsencrypt-prod",
  {
    apiVersion: "cert-manager.io/v1",
    kind: "ClusterIssuer",
    metadata: { name: "letsencrypt-prod" },
    spec: {
      acme: {
        server: "https://acme-v02.api.letsencrypt.org/directory",
        email: "dongitran@gmail.com",
        privateKeySecretRef: { name: "letsencrypt-prod-key" },
        solvers: [
          {
            http01: {
              ingress: { ingressClassName: "nginx" },
            },
          },
        ],
      },
    },
  },
  { provider: k8sProvider, dependsOn: [certManager] },
);

// ---------------------------------------------------------------------------
// Ingress — subdomain routing via NGINX ingress controller
//
// Traffic flow:
//   api.good-job.xyz/* → api-svc:3000  (NestJS has setGlobalPrefix('api'))
//   good-job.xyz/*     → web-svc:80    (nginx SPA)
// ---------------------------------------------------------------------------
const ingress = new k8s.networking.v1.Ingress(
  "apps-ingress",
  {
    metadata: {
      name: "apps-ingress",
      namespace: ns,
      annotations: {
        // TLS — cert-manager auto-provisions Let's Encrypt certificate
        "cert-manager.io/cluster-issuer": "letsencrypt-prod",
        // CORS is handled by NestJS (app-bootstrap.ts) — not at Ingress level
        // to avoid double CORS headers on API responses.
        // Redirect HTTP to HTTPS
        "nginx.ingress.kubernetes.io/ssl-redirect": "true",
      },
    },
    spec: {
      ingressClassName: "nginx",
      tls: [
        {
          hosts: ["good-job.xyz", "api.good-job.xyz"],
          secretName: "good-job-xyz-tls",
        },
      ],
      rules: [
        // API — api.good-job.xyz
        {
          host: "api.good-job.xyz",
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: apiService.metadata.name,
                    port: { number: 3000 },
                  },
                },
              },
            ],
          },
        },
        // Web — good-job.xyz
        {
          host: "good-job.xyz",
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: webService.metadata.name,
                    port: { number: 80 },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
  { provider: k8sProvider, dependsOn: [letsEncryptIssuer] },
);

// ---------------------------------------------------------------------------
// Certificate — explicitly create Certificate resource for Let's Encrypt
// ---------------------------------------------------------------------------
// cert-manager should auto-create this from Ingress annotation, but we
// explicitly create it to ensure it exists and can debug if ACME fails
const certificate = new k8s.apiextensions.CustomResource(
  "good-job-xyz-cert",
  {
    apiVersion: "cert-manager.io/v1",
    kind: "Certificate",
    metadata: {
      name: "good-job-xyz-tls",
      namespace: ns,
    },
    spec: {
      secretName: "good-job-xyz-tls",
      issuerRef: {
        name: "letsencrypt-prod",
        kind: "ClusterIssuer",
      },
      dnsNames: ["good-job.xyz", "api.good-job.xyz"],
    },
  },
  { provider: k8sProvider, dependsOn: [letsEncryptIssuer, ingress] },
);

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export const namespaceName = ns;
export const apiServiceName = apiService.metadata.name;
export const webServiceName = webService.metadata.name;
export const ingressName = ingress.metadata.name;
export const certificateName = certificate.metadata.name;

import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import WelcomeStep from './steps/WelcomeStep';
import OrganizationStep from './steps/OrganizationStep';
import CoreValuesStep, { PRESET_VALUES, type CoreValueItem } from './steps/CoreValuesStep';
import InviteTeamStep from './steps/InviteTeamStep';
import AllSetStep from './steps/AllSetStep';

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 state
  const [orgData, setOrgData] = useState({
    name: '',
    industry: '',
    companySize: '',
    logoPreview: null as string | null,
    logoUrl: null as string | null,
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Step 3 state
  const [coreValues, setCoreValues] = useState<CoreValueItem[]>(
    PRESET_VALUES.map((v) => ({ ...v })),
  );

  // Step 4 state
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  // Step 5 state
  const [launchMode, setLaunchMode] = useState<'demo' | 'fresh'>('demo');

  const orgId = user?.orgId;

  useEffect(() => {
    return () => {
      if (orgData.logoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(orgData.logoPreview);
      }
    };
  }, [orgData.logoPreview]);

  // Redirect if already completed onboarding
  if (user?.onboardingCompletedAt) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogoUpload = async (file: File) => {
    if (!orgId) return;

    const previewUrl = URL.createObjectURL(file);
    setOrgData((prev) => {
      if (prev.logoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.logoPreview);
      }
      return { ...prev, logoPreview: previewUrl, logoUrl: null };
    });

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post<{ logoUrl: string }>(
        `/organizations/${orgId}/logo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      setOrgData((prev) => ({ ...prev, logoUrl: data.logoUrl }));
    } catch {
      toast.error('Failed to upload logo. Please try again.');
      setOrgData((prev) => ({ ...prev, logoUrl: null }));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleStep2Continue = async () => {
    if (!orgId || !orgData.name.trim() || isUploadingLogo) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = { name: orgData.name.trim() };
      if (orgData.industry) payload.industry = orgData.industry;
      if (orgData.companySize) payload.companySize = orgData.companySize;
      if (orgData.logoUrl) payload.logoUrl = orgData.logoUrl;
      await api.patch(`/organizations/${orgId}`, payload);
      setStep(3);
    } catch {
      toast.error('Failed to save organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Continue = async () => {
    if (!orgId) return;
    const selected = coreValues.filter((v) => v.selected);
    if (selected.length < 3) return;

    setIsSubmitting(true);
    try {
      await api.post(`/organizations/${orgId}/core-values`, {
        values: selected.map((v) => ({
          name: v.name,
          emoji: v.emoji,
        })),
      });
      setStep(4);
    } catch {
      toast.error('Failed to save core values. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep4Continue = async () => {
    if (!orgId) return;
    setIsSubmitting(true);
    try {
      if (invitedEmails.length > 0) {
        await api.post(`/organizations/${orgId}/invitations`, {
          emails: invitedEmails,
        });
      }
      setStep(5);
    } catch {
      toast.error('Failed to send invitations. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!orgId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/organizations/${orgId}/complete-onboarding`, {
        seedDemoData: launchMode === 'demo',
      });
      // Update auth store so OnboardingGuard no longer redirects here
      if (user) {
        setUser({ ...user, onboardingCompletedAt: new Date().toISOString() });
      }
      toast.success('Your workspace is ready!');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  switch (step) {
    case 1:
      return <WelcomeStep onContinue={() => setStep(2)} />;
    case 2:
      return (
        <OrganizationStep
          data={orgData}
          onChange={setOrgData}
          onUploadLogo={handleLogoUpload}
          onContinue={handleStep2Continue}
          onBack={() => setStep(1)}
          onSkip={() => setStep(3)}
          isSubmitting={isSubmitting}
          isUploadingLogo={isUploadingLogo}
        />
      );
    case 3:
      return (
        <CoreValuesStep
          values={coreValues}
          onChange={setCoreValues}
          onContinue={handleStep3Continue}
          onBack={() => setStep(2)}
          onSkip={() => setStep(4)}
          isSubmitting={isSubmitting}
        />
      );
    case 4:
      return (
        <InviteTeamStep
          emails={invitedEmails}
          onChange={setInvitedEmails}
          onContinue={handleStep4Continue}
          onBack={() => setStep(3)}
          onSkip={() => setStep(5)}
          isSubmitting={isSubmitting}
        />
      );
    case 5:
      return (
        <AllSetStep
          launchMode={launchMode}
          onChangeLaunchMode={setLaunchMode}
          orgName={orgData.name}
          valuesCount={coreValues.filter((v) => v.selected).length}
          membersCount={invitedEmails.length}
          onBack={() => setStep(4)}
          onFinish={handleFinish}
          isSubmitting={isSubmitting}
        />
      );
    default:
      return null;
  }
}

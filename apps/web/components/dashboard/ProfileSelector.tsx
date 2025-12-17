"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  type SignalProfile,
  type CustomProfile,
  SIGNAL_PROFILES,
} from "@/lib/drizzle/schema/user-preferences";

interface ProfileSelectorProps {
  value: SignalProfile;
  onChange: (profile: SignalProfile) => void;
  disabled?: boolean;
  customProfiles?: CustomProfile[];
}

export function ProfileSelector({
  value,
  onChange,
  disabled,
  customProfiles = [],
}: ProfileSelectorProps): React.ReactElement {
  // Find display name for current value
  const getDisplayName = (): string => {
    // Check built-in profiles
    const builtIn = SIGNAL_PROFILES[value as keyof typeof SIGNAL_PROFILES];
    if (builtIn) return builtIn.name;

    // Check custom profiles
    const custom = customProfiles.find((p) => p.id === value);
    if (custom) return custom.name;

    return "Select profile";
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="profile-select" className="text-sm font-medium">
        Profile:
      </label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as SignalProfile)}
        disabled={disabled}
      >
        <SelectTrigger id="profile-select" className="w-[200px]">
          <SelectValue placeholder="Select profile">{getDisplayName()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground">Built-in Profiles</SelectLabel>
            {(
              Object.entries(SIGNAL_PROFILES) as [
                keyof typeof SIGNAL_PROFILES,
                (typeof SIGNAL_PROFILES)[keyof typeof SIGNAL_PROFILES],
              ][]
            ).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{config.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>

          {customProfiles.length > 0 && (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-xs text-muted-foreground">Custom Profiles</SelectLabel>
                {customProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{profile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        M:{profile.weights.market}% N:{profile.weights.news}% S:{profile.weights.speech}%
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

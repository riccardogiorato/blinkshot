import { Input } from "@/components/ui/input";
import Logo from "@/components/logo";

type HeaderProps = {
  userAPIKey: string;
  onAPIKeyChange: (key: string) => void;
};

export function Header({ userAPIKey, onAPIKeyChange }: HeaderProps) {
  return (
    <header className="flex justify-center pt-4 md:justify-end">
      <div className="absolute left-1/2 top-6 -translate-x-1/2">
        <Logo />
      </div>
      <div className="hidden md:block">
        <label className="text-xs text-gray-200">
          [Optional] Add your{" "}
          <a
            href="https://api.together.xyz/settings/api-keys"
            target="_blank"
            className="underline underline-offset-4 transition hover:text-blue-500"
          >
            Together API Key
          </a>{" "}
        </label>
        <Input
          placeholder="API Key"
          type="password"
          value={userAPIKey}
          className="mt-1 bg-gray-400 text-gray-200 placeholder:text-gray-300"
          onChange={(e) => onAPIKeyChange(e.target.value)}
        />
      </div>
      <div className="block min-h-[30px] md:hidden" />
    </header>
  );
}

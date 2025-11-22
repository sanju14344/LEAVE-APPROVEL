import { UserIcon, BriefcaseIcon, ShieldIcon } from "@/components/icons";

type UserRole = "staff" | "pc" | "admin";

interface UserRoleBadgeProps {
    role: UserRole;
    className?: string;
}

const getRoleConfig = (role: UserRole) => {
    const configs = {
        staff: {
            label: "Advisor",
            className: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30",
            Icon: UserIcon,
        },
        pc: {
            label: "Program Coordinator",
            className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            Icon: BriefcaseIcon,
        },
        admin: {
            label: "Admin",
            className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
            Icon: ShieldIcon,
        },
    };
    return configs[role];
};

export default function UserRoleBadge({ role, className = "" }: UserRoleBadgeProps) {
    const config = getRoleConfig(role);
    const Icon = config.Icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.className} ${className}`}
        >
            <Icon size={14} />
            <span>{config.label}</span>
        </span>
    );
}

import { ClockIcon, CheckCircleIcon, XCircleIcon } from "@/components/icons";

type LeaveStatus = "pending_pc" | "pending_admin" | "approved" | "declined";

interface StatusBadgeProps {
    status: LeaveStatus;
    className?: string;
}

const getStatusConfig = (status: LeaveStatus) => {
    const configs = {
        pending_pc: {
            label: "Pending PC",
            className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            Icon: ClockIcon,
        },
        pending_admin: {
            label: "Pending Admin",
            className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            Icon: ClockIcon,
        },
        approved: {
            label: "Approved",
            className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            Icon: CheckCircleIcon,
        },
        declined: {
            label: "Declined",
            className: "bg-red-500/20 text-red-400 border-red-500/30",
            Icon: XCircleIcon,
        },
    };
    return configs[status];
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
    const config = getStatusConfig(status);
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

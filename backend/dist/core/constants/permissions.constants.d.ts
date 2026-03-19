export declare const PERMISSIONS: {
    readonly MEETING_READ: "meeting.read";
    readonly MEETING_READ_IN_CAMERA: "meeting.read.in_camera";
    readonly MEETING_WRITE: "meeting.write";
    readonly AGENDA_WRITE: "agenda.write";
    readonly AGENDA_PUBLISH: "agenda.publish";
    readonly REPORT_SUBMIT: "report.submit";
    readonly REPORT_APPROVE_DIRECTOR: "report.approve.director";
    readonly REPORT_APPROVE_CAO: "report.approve.cao";
    readonly TEMPLATES_MANAGE: "templates.manage";
    readonly USERS_MANAGE: "users.manage";
    readonly ROLES_MANAGE: "roles.manage";
    readonly MINUTES_WRITE: "minutes.write";
    readonly MINUTES_PUBLISH: "minutes.publish";
    readonly VOTE_RECORD: "vote.record";
    readonly PUBLIC_PUBLISH: "public.publish";
};
export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

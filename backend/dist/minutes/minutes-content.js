"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultMinutesContent = createDefaultMinutesContent;
exports.normalizeMinutesContent = normalizeMinutesContent;
exports.ensureMinutesFinalizeReadiness = ensureMinutesFinalizeReadiness;
const node_crypto_1 = require("node:crypto");
const ATTENDANCE_ROLES = ['CHAIR', 'COUNCIL_MEMBER', 'STAFF', 'GUEST'];
const MOTION_OUTCOMES = ['PENDING', 'CARRIED', 'DEFEATED', 'WITHDRAWN', 'TABLED', 'DEFERRED', 'REFERRED'];
const VOTE_METHODS = ['RECORDED', 'VOICE', 'HANDS'];
const RECORDED_VOTES = ['YES', 'NO', 'ABSTAIN'];
const ACTION_STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
function asObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value;
}
function asString(value, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}
function asNumber(value, fallback = 0) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function asOptionalString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}
function createDefaultMinutesContent() {
    return {
        schemaVersion: 1,
        summary: '',
        attendance: [],
        motions: [],
        votes: [],
        actionItems: [],
        notes: [],
    };
}
function normalizeMinutesContent(raw) {
    const source = asObject(raw);
    if (!source) {
        return createDefaultMinutesContent();
    }
    const attendanceSource = Array.isArray(source.attendance) ? source.attendance : [];
    const motionsSource = Array.isArray(source.motions) ? source.motions : [];
    const votesSource = Array.isArray(source.votes) ? source.votes : [];
    const actionItemsSource = Array.isArray(source.actionItems) ? source.actionItems : [];
    const notesSource = Array.isArray(source.notes) ? source.notes : [];
    const attendance = attendanceSource
        .map((entry) => asObject(entry))
        .filter((entry) => Boolean(entry))
        .map((entry) => {
        const roleCandidate = asString(entry.role, 'COUNCIL_MEMBER').toUpperCase();
        return {
            id: asString(entry.id, (0, node_crypto_1.randomUUID)()),
            personName: asString(entry.personName),
            role: ATTENDANCE_ROLES.includes(roleCandidate) ? roleCandidate : 'COUNCIL_MEMBER',
            present: Boolean(entry.present),
            arrivalAt: asOptionalString(entry.arrivalAt),
            departureAt: asOptionalString(entry.departureAt),
            notes: asOptionalString(entry.notes),
        };
    })
        .filter((entry) => entry.personName.trim().length > 0);
    const votes = votesSource
        .map((entry) => asObject(entry))
        .filter((entry) => Boolean(entry))
        .map((entry) => {
        const methodCandidate = asString(entry.method, 'VOICE').toUpperCase();
        const recordedVotesSource = Array.isArray(entry.recordedVotes) ? entry.recordedVotes : [];
        const recordedVotes = recordedVotesSource
            .map((item) => asObject(item))
            .filter((item) => Boolean(item))
            .map((item) => {
            const voteCandidate = asString(item.vote, 'ABSTAIN').toUpperCase();
            return {
                personName: asString(item.personName),
                vote: RECORDED_VOTES.includes(voteCandidate) ? voteCandidate : 'ABSTAIN',
            };
        })
            .filter((item) => item.personName.trim().length > 0);
        return {
            id: asString(entry.id, (0, node_crypto_1.randomUUID)()),
            motionId: asOptionalString(entry.motionId),
            method: VOTE_METHODS.includes(methodCandidate) ? methodCandidate : 'VOICE',
            yesCount: Math.max(0, asNumber(entry.yesCount, 0)),
            noCount: Math.max(0, asNumber(entry.noCount, 0)),
            abstainCount: Math.max(0, asNumber(entry.abstainCount, 0)),
            recordedVotes,
        };
    });
    const motions = motionsSource
        .map((entry) => asObject(entry))
        .filter((entry) => Boolean(entry))
        .map((entry) => {
        const outcomeCandidate = asString(entry.outcome, 'PENDING').toUpperCase();
        return {
            id: asString(entry.id, (0, node_crypto_1.randomUUID)()),
            agendaItemId: asOptionalString(entry.agendaItemId),
            title: asString(entry.title),
            mover: asOptionalString(entry.mover),
            seconder: asOptionalString(entry.seconder),
            outcome: MOTION_OUTCOMES.includes(outcomeCandidate) ? outcomeCandidate : 'PENDING',
            voteId: asOptionalString(entry.voteId),
            notes: asOptionalString(entry.notes),
        };
    })
        .filter((entry) => entry.title.trim().length > 0);
    const actionItems = actionItemsSource
        .map((entry) => asObject(entry))
        .filter((entry) => Boolean(entry))
        .map((entry) => {
        const statusCandidate = asString(entry.status, 'OPEN').toUpperCase();
        return {
            id: asString(entry.id, (0, node_crypto_1.randomUUID)()),
            description: asString(entry.description),
            owner: asOptionalString(entry.owner),
            dueDate: asOptionalString(entry.dueDate),
            status: ACTION_STATUSES.includes(statusCandidate) ? statusCandidate : 'OPEN',
        };
    })
        .filter((entry) => entry.description.trim().length > 0);
    const notes = notesSource
        .filter((entry) => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    return {
        schemaVersion: 1,
        summary: asString(source.summary),
        attendance,
        motions,
        votes,
        actionItems,
        notes,
    };
}
function ensureMinutesFinalizeReadiness(content) {
    const issues = [];
    if (content.attendance.filter((entry) => entry.present).length === 0) {
        issues.push('At least one present attendee is required before finalizing minutes.');
    }
    if (content.motions.length === 0) {
        issues.push('At least one motion record is required before finalizing minutes.');
    }
    const unresolvedMotions = content.motions.filter((motion) => motion.outcome === 'PENDING');
    if (unresolvedMotions.length > 0) {
        issues.push('All motions must have an outcome before finalizing minutes.');
    }
    return issues;
}
//# sourceMappingURL=minutes-content.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUIRED_AGENDA_SECTION_TITLES = exports.MUNICIPAL_PROFILES = exports.DEFAULT_MUNICIPAL_PROFILE = void 0;
exports.inferAgendaTemplateProfile = inferAgendaTemplateProfile;
exports.DEFAULT_MUNICIPAL_PROFILE = {
    id: 'BC_BASELINE',
    displayName: 'BC Municipal Baseline',
    jurisdiction: 'British Columbia',
    requiresClosedSessionReason: true,
};
exports.MUNICIPAL_PROFILES = [
    exports.DEFAULT_MUNICIPAL_PROFILE,
    {
        id: 'AB_BASELINE',
        displayName: 'AB Municipal Baseline',
        jurisdiction: 'Alberta',
        requiresClosedSessionReason: true,
    },
    {
        id: 'ON_BASELINE',
        displayName: 'ON Municipal Baseline',
        jurisdiction: 'Ontario',
        requiresClosedSessionReason: false,
    },
];
exports.REQUIRED_AGENDA_SECTION_TITLES = {
    REGULAR_COUNCIL: [
        'Call to Order',
        'Approval of Agenda',
        'Disclosure of Pecuniary Interest',
        'Adoption of Previous Minutes',
        'Staff Reports and Correspondence',
        'Bylaws',
        'Confirming Bylaw',
        'Adjournment',
    ],
    SPECIAL_COUNCIL: [
        'Call to Order',
        'Approval of Agenda',
        'Disclosure of Pecuniary Interest',
        'Special Business',
        'Confirming Bylaw',
        'Adjournment',
    ],
    COMMITTEE_OF_WHOLE: [
        'Call to Order',
        'Approval of Agenda',
        'Disclosure of Pecuniary Interest',
        'Staff Reports and Discussion Items',
        'Recommendations to Council',
        'Adjournment',
    ],
    IN_CAMERA: [
        'Call to Order',
        'Approval of In-Camera Agenda',
        'Disclosure of Pecuniary Interest',
        'Closed Session Authority',
        'In-Camera Discussion Items',
        'Rise and Report',
        'Adjournment',
    ],
};
function inferAgendaTemplateProfile(template) {
    const source = `${template?.code ?? ''} ${template?.name ?? ''}`.toLowerCase();
    if (source.includes('in camera') || source.includes('in-camera') || source.includes('incamera') || source.includes('closed')) {
        return 'IN_CAMERA';
    }
    if (source.includes('committee of the whole') || source.includes('c.o.w') || source.includes('cow')) {
        return 'COMMITTEE_OF_WHOLE';
    }
    if (source.includes('special')) {
        return 'SPECIAL_COUNCIL';
    }
    return 'REGULAR_COUNCIL';
}
//# sourceMappingURL=municipal-profile.constants.js.map
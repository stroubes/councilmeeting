"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAgendaItemDto = void 0;
const class_validator_1 = require("class-validator");
const AGENDA_ITEM_TYPES = [
    'SECTION',
    'STAFF_REPORT',
    'MOTION',
    'BYLAW',
    'INFO_ITEM',
    'CONSENT_ITEM',
    'OTHER',
];
class CreateAgendaItemDto {
    itemType;
    title;
    description;
    parentItemId;
    isInCamera;
}
exports.CreateAgendaItemDto = CreateAgendaItemDto;
__decorate([
    (0, class_validator_1.IsIn)(AGENDA_ITEM_TYPES),
    __metadata("design:type", Object)
], CreateAgendaItemDto.prototype, "itemType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateAgendaItemDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgendaItemDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgendaItemDto.prototype, "parentItemId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAgendaItemDto.prototype, "isInCamera", void 0);
//# sourceMappingURL=create-agenda-item.dto.js.map
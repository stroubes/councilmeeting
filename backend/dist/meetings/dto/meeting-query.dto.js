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
exports.MeetingQueryDto = void 0;
const class_validator_1 = require("class-validator");
const MEETING_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'ADJOURNED', 'CANCELLED', 'COMPLETED'];
class MeetingQueryDto {
    inCamera;
    publicOnly;
    status;
}
exports.MeetingQueryDto = MeetingQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], MeetingQueryDto.prototype, "inCamera", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], MeetingQueryDto.prototype, "publicOnly", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(MEETING_STATUSES),
    __metadata("design:type", Object)
], MeetingQueryDto.prototype, "status", void 0);
//# sourceMappingURL=meeting-query.dto.js.map
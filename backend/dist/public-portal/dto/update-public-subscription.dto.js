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
exports.UpdatePublicSubscriptionDto = void 0;
const class_validator_1 = require("class-validator");
const SUBSCRIPTION_TOPICS = ['MEETINGS', 'AGENDAS', 'REPORTS', 'MINUTES', 'MOTIONS', 'BUDGET'];
const SUBSCRIPTION_FREQUENCIES = ['IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST'];
class UpdatePublicSubscriptionDto {
    topics;
    watchKeywords;
    frequency;
    isActive;
}
exports.UpdatePublicSubscriptionDto = UpdatePublicSubscriptionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(SUBSCRIPTION_TOPICS, { each: true }),
    __metadata("design:type", Array)
], UpdatePublicSubscriptionDto.prototype, "topics", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(80, { each: true }),
    __metadata("design:type", Array)
], UpdatePublicSubscriptionDto.prototype, "watchKeywords", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(SUBSCRIPTION_FREQUENCIES),
    __metadata("design:type", Object)
], UpdatePublicSubscriptionDto.prototype, "frequency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePublicSubscriptionDto.prototype, "isActive", void 0);
//# sourceMappingURL=update-public-subscription.dto.js.map
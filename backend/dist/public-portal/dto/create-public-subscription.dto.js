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
exports.CreatePublicSubscriptionDto = void 0;
const class_validator_1 = require("class-validator");
const SUBSCRIPTION_TOPICS = ['MEETINGS', 'AGENDAS', 'REPORTS', 'MINUTES', 'MOTIONS', 'BUDGET'];
const SUBSCRIPTION_FREQUENCIES = ['IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST'];
class CreatePublicSubscriptionDto {
    email;
    topics;
    watchKeywords;
    frequency;
}
exports.CreatePublicSubscriptionDto = CreatePublicSubscriptionDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreatePublicSubscriptionDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(SUBSCRIPTION_TOPICS, { each: true }),
    __metadata("design:type", Array)
], CreatePublicSubscriptionDto.prototype, "topics", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(80, { each: true }),
    __metadata("design:type", Array)
], CreatePublicSubscriptionDto.prototype, "watchKeywords", void 0);
__decorate([
    (0, class_validator_1.IsIn)(SUBSCRIPTION_FREQUENCIES),
    __metadata("design:type", Object)
], CreatePublicSubscriptionDto.prototype, "frequency", void 0);
//# sourceMappingURL=create-public-subscription.dto.js.map
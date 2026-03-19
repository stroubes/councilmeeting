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
exports.SetActiveProfileDto = void 0;
const class_validator_1 = require("class-validator");
const municipal_profile_constants_1 = require("../municipal-profile.constants");
const PROFILE_IDS = municipal_profile_constants_1.MUNICIPAL_PROFILES.map((profile) => profile.id);
class SetActiveProfileDto {
    profileId;
}
exports.SetActiveProfileDto = SetActiveProfileDto;
__decorate([
    (0, class_validator_1.IsIn)(PROFILE_IDS),
    __metadata("design:type", Object)
], SetActiveProfileDto.prototype, "profileId", void 0);
//# sourceMappingURL=set-active-profile.dto.js.map
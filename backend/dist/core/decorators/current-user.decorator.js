"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((field, context) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !field) {
        return user;
    }
    return user[field];
});
//# sourceMappingURL=current-user.decorator.js.map
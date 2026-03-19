"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const express_1 = require("express");
const app_module_1 = require("./app.module");
async function bootstrap() {
    if (process.env.NODE_ENV === 'production' && process.env.AUTH_BYPASS_ENABLED === 'true') {
        throw new Error('AUTH_BYPASS_ENABLED cannot be true in production.');
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, express_1.json)({ limit: '80mb' }));
    app.use((0, express_1.urlencoded)({ limit: '80mb', extended: true }));
    app.enableCors({
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
//# sourceMappingURL=main.js.map
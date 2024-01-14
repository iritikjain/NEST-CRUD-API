import { Body, Controller, HttpCode, HttpStatus, ParseIntPipe, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";

// route --> /auth
@Controller('auth')  
export class AuthController {
    constructor (private authService: AuthService){}
        
        // route --> /auth/signup
        @HttpCode(HttpStatus.CREATED)
        @Post('signup')
        signup( @Body() dto: AuthDto ) {
            return this.authService.signup(dto);
        }
        
        // route --> /auth/signin
        @HttpCode(HttpStatus.OK)
        @Post('signin')
        signin( @Body() dto: AuthDto ) {
            return this.authService.signin(dto);
        }
    
}
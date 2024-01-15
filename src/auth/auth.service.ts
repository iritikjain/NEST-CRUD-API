import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {}
    async signup(dto: AuthDto){

        //generate the password hash
        const passwordHash = await argon.hash(dto.password); 
        
        //save the new user in the db
        try{
            const user = await this.prisma.user.create({
                data:{
                    email: dto.email,
                    passwordHash
                },
                // select:{
                //     id: true,
                //     email: true,
                //     createdAt: true
                // }
            })
    
            //return the saved user
            // delete user.passwordHash;
            // return user;
            return this.signToken(user.id, user.email);
        } catch (error){
            if (error instanceof PrismaClientKnownRequestError){
                if (error.code === 'P2002'){
                    throw new ForbiddenException('User Already Exists!',);
                }
            }
            throw error;
        }
    }

    async signin(dto: AuthDto){

        //find the user by email !!!findUnique!!!
        const user = await this.prisma.user.findFirst({
            where:{
                email: dto.email,
            }
        });

        //if user does not exist throw an exception
        if (!user){
            throw new ForbiddenException('Email Incorrect. Try Again.');
        }

        //compare passwords
        const pwMatches = await argon.verify(user.passwordHash, dto.password)
        
        //if password does not match throw an exception ie. incorrect password
        if (!pwMatches){
            throw new ForbiddenException('Credentials Incorrect. Try Again.');
        }

        //return the valid user
        // delete user.passwordHash;
        // return user;
        return this.signToken(user.id, user.email);
    }

    async signToken(userId: number, email: string) : Promise<{access_token: string}> {
        const payload = {
            sub: userId, email
        };
        const secret = this.config.get('JWT_SECRET');
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: secret,
        });
        return {
            access_token: token,
        };
    }

}
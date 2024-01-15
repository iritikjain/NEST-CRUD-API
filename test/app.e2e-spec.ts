import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.service";
import * as pactum from 'pactum';
import { AuthDto } from "src/auth/dto";
import { EditUserDto } from "src/user/dto";
import { CreateBookmarkDto, EditBookmarkDto } from "src/bookmark/dto";

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = 
      await Test.createTestingModule({
        imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    }));
    await app.init();
    await app.listen(3333);
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    
    const dto: AuthDto = {
      email: 'abc@xyz.com',
      password: '1234'
    }

    describe('Signup', () => {
      it('Should Throw Err If No Body', () => {
        return pactum.spec().post('/auth/signup', ).expectStatus(400);
      });
      it('Should Throw Err If Email Is Empty', () => {
        return pactum.spec().post('/auth/signup', ).withBody({password: dto.password}).expectStatus(400);
      });
      it('Should Throw Err If Password Is Empty', () => {
        return pactum.spec().post('/auth/signup', ).withBody({email: dto.email}).expectStatus(400);
      });
      it('Should Signup', () => {
          return pactum.spec().post('/auth/signup', ).withBody(dto).expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('Should Throw Err If No Body', () => {
        return pactum.spec().post('/auth/signin', ).expectStatus(400);
      });
      it('Should Throw Err If Email Is Empty', () => {
        return pactum.spec().post('/auth/signin', ).withBody({password: dto.password}).expectStatus(400);
      });
      it('Should Throw Err If Password Is Empty', () => {
        return pactum.spec().post('/auth/signin', ).withBody({email: dto.email}).expectStatus(400);
      });
      it('Should Signin', () => {
        return pactum.spec().post('/auth/signin', ).withBody(dto).expectStatus(200).stores('userAt', 'access_token');
    });
    })
  });

  describe('User', () => {
    describe('Get Me', () => {
      it('Should Get Current User', () => {
        return pactum.spec().get('/users/me', ).withHeaders({Authorization: 'Bearer $S{userAt}'}).expectStatus(200);
      });
    });

    describe('Edit User', () => {
      it('Should Edit Current User', () => {
        const dto: EditUserDto = {
          firstName: 'RJ',
          email: 'RJ@mail.com',
        }
        return pactum.spec().patch('/users', ).withHeaders({Authorization: 'Bearer $S{userAt}'}).withBody(dto).expectStatus(200).expectBodyContains(dto.firstName).expectBodyContains(dto.email);
      });
    })
  });

  describe('Bookmarks', () => {
    describe('Get Empty Bookmarks', () => {
      it('Should Get Empty Bookmarks', () => {
        return pactum.spec().get('/bookmarks', ).withHeaders({Authorization: 'Bearer $S{userAt}'}).expectStatus(200).expectBody([]);
      });
    });
    describe('Create Bookmarks', () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        description: 'My First Bookmark',
        link: 'https://www.google.com',
      }
      it('Should Create A Bookmark', () => {
        return pactum.spec().post('/bookmarks', ).withHeaders({Authorization: 'Bearer $S{userAt}'}).withBody(dto).expectStatus(201).inspect();
      });
    });
    describe('Get Bookmarks', () => {
      it('Should Get Bookmarks', () => {
        return pactum.spec().get('/bookmarks', ).withHeaders({Authorization: 'Bearer $S{userAt}'}).expectStatus(200).expectJsonLength(1).inspect();
      });
    });
    describe('Get Bookmarks By ID', () => {
      it('Should Get Bookmarks By ID', () => {
        return pactum.spec().get('/bookmarks/{id}', ).withPathParams('id', '$S{bookmarkId}').withHeaders({Authorization: 'Bearer $S{userAt}'}).expectStatus(200).expectJsonLength(1).expectBodyContains('$S{bookmarkId}').inspect();
      });
    });
    describe('Edit Bookmark By ID', () => {
      const dto: EditBookmarkDto = {
        title: "Second Blog",
        description: "My Second Blog"
      };
      it('Should Edit Bookmark By ID', () => {
        return pactum.spec().patch('/bookmarks/{id}', ).withPathParams('id', '$S{bookmarkId}').withHeaders({Authorization: 'Bearer $S{userAt}'}).expectBodyContains(dto.title).expectBodyContains(dto.description).withBody(dto).expectStatus(200).inspect();
      });
    });
    describe('Delete Bookmarks By ID', () => {
      it('Should Delete Bookmark By ID', () => {
        return pactum.spec().delete('/bookmarks/{id}', ).withPathParams('id', '$S{bookmarkId}').withHeaders({Authorization: 'Bearer $S{userAt}'}).expectStatus(204).inspect();
      });
    })
    describe('Get Empty Bookmarks', () => {
      it('Should Get Empty Bookmarks', () => {
        return pactum.spec().get('/bookmarks', ).withHeaders({Authorization: 'Bearer $S{userAt}'}).expectStatus(200).expectJsonLength(0);
      });
    });
  });
});

import "reflect-metadata";
import {Controller} from "../../src/decorator/controllers";
import {Get, Post} from "../../src/decorator/methods";
import {createExpressServer, defaultMetadataArgsStorage, createKoaServer} from "../../src/index";
import {
    HttpCode,
    EmptyResultCode,
    NullResultCode,
    UndefinedResultCode,
    ContentType,
    Header,
    Location,
    Redirect
} from "../../src/decorator/decorators";
import {Param} from "../../src/decorator/params";
import {assertRequest} from "./test-utils";
const chakram = require("chakram");
const expect = chakram.expect;

describe("other controller decorators", () => {
    before(() => {

        // reset metadata args storage
        defaultMetadataArgsStorage().reset();

        @Controller()
        class OtherDectoratorsController {
            
            @Post("/users")
            @HttpCode(201)
            getUsers() {
                return "<html><body>User has been created</body></html>";
            }
            
            @Get("/admin")
            @HttpCode(403)
            getAdmin() {
                return "<html><body>Access is denied</body></html>";
            }

            @Get("/users/:id")
            @EmptyResultCode(404)
            getUser(@Param("id") id: number) {
                return new Promise((ok, fail) => {
                    if (id === 1) {
                        ok("User");

                    } else if (id === 2) {
                        ok("");

                    } else if (id === 3) {
                        ok(null);

                    } else {
                        ok(undefined);
                    }
                });
            }

            @Get("/posts/:id")
            @NullResultCode(404)
            getPost(@Param("id") id: number) {
                return new Promise((ok, fail) => {
                    if (id === 1) {
                        ok("Post");

                    } else if (id === 2) {
                        ok("");

                    } else if (id === 3) {
                        ok(null);

                    } else {
                        ok(undefined);
                    }
                });
            }

            @Get("/photos/:id")
            @UndefinedResultCode(201)
            getPhoto(@Param("id") id: number) {
                if (id === 4) {
                    return undefined;
                }
                
                return new Promise((ok, fail) => {
                    if (id === 1) {
                        ok("Photo");

                    } else if (id === 2) {
                        ok("");

                    } else if (id === 3) {
                        ok(null);

                    } else {
                        ok(undefined);
                    }
                });
            }

            @Get("/homepage")
            @ContentType("text/html; charset=utf-8")
            getHomepage() {
                return "<html><body>Hello world</body></html>";
            }

            @Get("/textpage")
            @ContentType("text/plain; charset=utf-8")
            getTextpage() {
                return "Hello text";
            }

            @Get("/userdash")
            @Header("authorization", "Barer abcdefg")
            @Header("development-mode", "enabled")
            getUserdash() {
                return "<html><body>Hello, User</body></html>";
            }

            @Get("/github")
            @Location("http://github.com")
            getToGithub() {
                return "<html><body>Hello, github</body></html>";
            }

            @Get("/github-redirect")
            @Redirect("http://github.com")
            goToGithub() { // todo: need test for this one
                return "<html><body>Hello, github</body></html>";
            }
            
        }
    });

    let expressApp: any, koaApp: any;
    before(done => expressApp = createExpressServer().listen(3001, done));
    after(done => expressApp.close(done));
    before(done => koaApp = createKoaServer().listen(3002, done));
    after(done => koaApp.close(done));

    describe("should return httpCode set by @HttpCode decorator", () => {
        assertRequest([3001, 3002], "post", "users", { name: "Umed" }, response => {
            expect(response).to.have.status(201);
            expect(response.body).to.be.eql("<html><body>User has been created</body></html>");
        });

        assertRequest([3001, 3002], "get", "admin", response => {
            expect(response).to.have.status(403);
            expect(response.body).to.be.eql("<html><body>Access is denied</body></html>");
        });
    });

    describe("should return custom code when @EmptyResultCode", () => {

        assertRequest([3001, 3002], "get", "users/1", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.be.eql("User");
        });
        assertRequest([3001, 3002], "get", "users/2", response => {
            expect(response).to.have.status(404);
        });
        assertRequest([3001, 3002], "get", "users/3", response => {
            expect(response).to.have.status(404);
        });
        assertRequest([3001, 3002], "get", "users/4", response => {
            expect(response).to.have.status(404);
        });
        assertRequest([3001, 3002], "get", "users/5", response => {
            expect(response).to.have.status(404);
        });
        
    });

    describe("should return custom code when @NullResultCode", () => {
        assertRequest([3001, 3002], "get", "posts/1", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.be.eql("Post");
        });
        assertRequest([3001, 3002], "get", "posts/2", response => {
            expect(response).to.have.status(200);
        });
        assertRequest([3001, 3002], "get", "posts/3", response => {
            expect(response).to.have.status(404);
        });
        assertRequest([3001, 3002], "get", "posts/4", response => {
            expect(response).to.have.status(404); // this is expected because for undefined 404 is given by default
        });
        assertRequest([3001, 3002], "get", "posts/5", response => {
            expect(response).to.have.status(404); // this is expected because for undefined 404 is given by default
        });
    });
    
    describe("should return custom code when @UndefinedResultCode", () => {
        assertRequest([3001, 3002], "get", "photos/1", response => {
            expect(response).to.have.status(200);
            expect(response.body).to.be.eql("Photo");
        });
        assertRequest([3001, 3002], "get", "photos/2", response => {
            expect(response).to.have.status(200);
        });
        assertRequest([3001, 3002], "get", "photos/3", response => {
            expect(response).to.have.status(204); // because of null
        });
        assertRequest([3001, 3002], "get", "photos/4", response => {
            expect(response).to.have.status(201);
        });
        assertRequest([3001, 3002], "get", "photos/5", response => {
            expect(response).to.have.status(201);
        });
    });

    describe("should return content-type in the response when @ContentType is used", () => {
        assertRequest([3001, 3002], "get", "homepage", response => {
            expect(response).to.have.status(200);
            expect(response).to.have.header("content-type", "text/html; charset=utf-8");
            expect(response.body).to.be.eql("<html><body>Hello world</body></html>");
        });
    });

    describe("should return content-type in the response when @ContentType is used", () => {
        assertRequest([3001, 3002], "get", "textpage", response => {
            expect(response).to.have.status(200);
            expect(response).to.have.header("content-type", "text/plain; charset=utf-8");
            expect(response.body).to.be.eql("Hello text");
        });
    });

    describe("should return response with custom headers when @Header is used", () => {
        assertRequest([3001, 3002], "get", "userdash", response => {
            expect(response).to.have.status(200);
            expect(response).to.have.header("authorization", "Barer abcdefg");
            expect(response).to.have.header("development-mode", "enabled");
            expect(response.body).to.be.eql("<html><body>Hello, User</body></html>");
        });
    });

    describe("should relocate to new location when @Location is used", () => {
        assertRequest([3001, 3002], "get", "github", response => {
            expect(response).to.have.status(200);
            expect(response).to.have.header("location", "http://github.com");
        });
    });

});
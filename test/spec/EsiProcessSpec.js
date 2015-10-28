/* eslint-env jasmine */
"use strict";

let EsiProcessor = require("index"),
    nock = require("nock");


describe("EsiProcessor", () => {
    let tagText = '<esi:include src="http://localhost:3080/some.html" alt="http://localhost:3080/alt.html" />';
    let esi = new EsiProcessor();

    it("interpretes include tag", () => {
        let tag = esi.interprete(tagText);
        expect(tag).not.toBeNull();
        expect(tag.attributes.src).toBe("http://localhost:3080/some.html");
        expect(tag.attributes.alt).toBe("http://localhost:3080/alt.html");
    });

    it("processes a single include tag", done => {
        nock("http://localhost:3080")
            .get("/some.html")
            .reply(200, "the response");

        let tag = esi.interprete('<esi:include src="http://localhost:3080/some.html" />');
        esi.processTag(tag)
            .then(result => {
                expect(result).toBe("the response");
                done();
            })
            .catch(done.fail);
    });

    it("processes a batch of include tags", done => {
        nock("http://localhost:3080")
            .get("/one.html")
            .reply(200, "first");
        nock("http://localhost:3080")
            .get("/two.html")
            .reply(200, "second");

        let tags = [
            esi.interprete('<esi:include src="http://localhost:3080/one.html" />'),
            esi.interprete('<esi:include src="http://localhost:3080/two.html" />')
        ];

        esi.processBatch(tags).then(result => {
            expect(result.length).toBe(2);
            expect(result).toContain("first");
            expect(result).toContain("second");
            done();
        }).catch(done.fail);
    });

    it("processText makes no changes if there are no ESI tags", done => {
        esi.processText("hello world").then(result => {
            expect(result).toBe("hello world");
            done();
        }).catch(done.fail);
    });

    it("processes a text with multiple tags", done => {
        let text = 'The <esi:include src="http://localhost:3080/two.html" /> '
                 + 'and the <esi:include src="http://localhost:3080/three.html" />.';

        nock("http://localhost:3080")
            .get("/two.html")
            .reply(200, "second");
        nock("http://localhost:3080")
            .get("/three.html")
            .reply(200, "third");

        esi.processText(text).then(result => {
            expect(result).toBe("The second and the third.");
            done();
        }).catch(done.fail);
    });

    it("processes nested esi urls", done => {
        let text = 'The <esi:include src="http://localhost:3080/two.html" /> '
                 + 'and the <esi:include src="http://localhost:3080/three.html" />.';

        nock("http://localhost:3080")
            .get("/one.html")
            .reply(200, "first");
        nock("http://localhost:3080")
            .get("/two.html")
            .reply(200, '<esi:include src="http://localhost:3080/one.html" /> and second');
        nock("http://localhost:3080")
            .get("/three.html")
            .reply(200, "third");

        esi.processText(text).then(result => {
            expect(result).toBe("The first and second and the third.");
            done();
        }).catch(done.fail);
    });
});
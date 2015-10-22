"use strict";

let http = require("http");

class EsiProcessor {
    constructor() {
        // precompile regular expressions
        this.attributeMatcher = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
        this.tagValidator = /^<esi:include[^<>]*>$/;
        this.tagExtractor = /<esi:.+?>/g;
    }

    interprete(tagText) {
        if (!tagText.match(this.tagValidator)) {
            throw new Error("invalid esi tag");
        }

        let tag = {
            operation: "include",
            attributes: {}
        };

        let match;
        while (match = this.attributeMatcher.exec(tagText)) {
            tag.attributes[match[1]] = match[2];
        }

        return tag;
    }
    
    /**
     * processes an (include) interpreted ESI tag
     *
     * @param {Object} tag
     * @returns {Promise}
     * @resolve {string}
     */
    processTag(tag) {
        if (!(tag instanceof Object)) {
            throw new Error("processTag expects a tag Object as parameter");
        }
        return new Promise((resolve, reject) => {
            let request = http.get(tag.attributes.src, result => {
                let body = "";
                result.on("data", data => body += data)
                      .on("end", () => resolve(body));
            });

            request.on("error", reject);
        });
    }

    /**
     * returns a promise, which processes all tags, and resolves when all are ready
     *
     * @param {Array.<Object>} tags - array of tags, see interprete() method
     * @returns {Promise}
     * @resolve {Array.<string>}
     */
    processBatch(tags) {
        let promises = tags.map(
            tag => this.processTag(tag)
                       .then(this.processText.bind(this))
        );
        return Promise.all(promises);
    }

    /**
     * processes a text potentially containing ESI tags recursively
     * @param {string} text
     * @return {Promise}
     * @resolve {string}
     */
    processText(text) {
        let replacePoints = [],
            tags = [];

        let match;
        while (match = this.tagExtractor.exec(text)) {
            // store index and matched snippet,
            // so that we can later on replace it with result
            replacePoints.push(match);

            // prepare a list of tags, which have to be processed as a batch
            tags.push(this.interprete(match[0]));
        }

        // if no ESI tags found, then just return the original string
        if (!replacePoints.length) {
            return Promise.resolve(text);
        }

        return new Promise((resolve, reject) => {
            this.processBatch(tags).then(chunks => {
                let result = text.substring(0, replacePoints[0].index);
                
                for (let i = 0; i < chunks.length; i++) {
                    result += chunks[i];
                    let nextIndex = replacePoints[i + 1] === undefined
                            ? text.length
                            : replacePoints[i + 1].index,
                        endOfTag = replacePoints[i].index + replacePoints[i][0].length;
                    result += text.substring(endOfTag, nextIndex);
                }
                resolve(result);
            }).catch(reject);
        });
    }

}

module.exports = EsiProcessor;

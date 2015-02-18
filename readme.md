# beam-emoticons

This repo is used for storage of all emoticon packs that are available on Beam. If you'd like to create and sell an emoticon pack, open a pull request to this repo. Your pull request should consist of:

 * A subdirectory with a sensible name
 * An `index.json` in that subdirectory. See below.
 * One or more SVG files within the directory for each emoticon. Every svg must be a 1:1 square ratio, and does not need not be compressed or minified.

### index.json format

The index.json describes your emoticon pack to us. It can contain the following sections and subsections:

 * *name* - The display name of the page.
 * *authors* - An array of strings indicating the original authors and their copyright status.
 * *emoticons* - A map of typed strings to their svg correspondents. For example, the entry `":)": "smile"` would cause `smile.svg` to be displayed in place of `:)`.
 * *default* (optional) - Whether the emoticon pack should be "given" to all users by default.
 * *cost* (optional) - If you'd like your pack listed on the Beam store, you should include this section. It should be the number of Beam Points it costs to purchase the pack.

### License

Every emotion in this pack is copyright by their respective owners, as indicated in their `index.json`. By submitting a pull request to this repository, you acknowledge that you own or have rights to distribute and sublicense the emoticons, and that your content does not infringe upon the intellectual property rights of a third party. By opening a pull request you understand that, while maintaining copyright, you grant Beam LLC a non-exclusive, transferable, sub-licensable, royalty-free, worldwide license to use the contents of your pull request on the Beam website (https://beam.pro) and that of related services.

export interface IEmote {
    x: number;
    y: number;
    width: number;
    height: number;
    alt: { [locale: string]: string }
}

export interface IPack {
    name: string;
    default: boolean;
    authors: string[];
    path: string;
    emoticons: { [text: string]: IEmote };
}
q
const emoticons: { [key: string]: IPack };
namespace emoticons {}

export = emoticons;

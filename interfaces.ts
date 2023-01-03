export interface SoulsActive {
    [key: string]: {
        interests: Array<string>,
        connectWithMostSoulful: boolean
    }
}

export interface Interests {
    [key: string]: Array<string>
}
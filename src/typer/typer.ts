// Alle aktiviteter
export interface Aktivitet {
    navn: string;
    aktivitetId: AktivitetID;
}

export enum AktivitetID {
    PUSHUPS = 'PUSHUPS',
    SITUPS = 'SITUPS',
}

// Brukers data
export type MineMål = Record<AktivitetID, number>;
export const startMål: MineMål = { PUSHUPS: 0, SITUPS: 0 };

export const initiellProfil: Profil = {
    mineØkter: [],
    mineMål: startMål,
};

export interface Profil {
    mineØkter: Økt[];
    mineMål: MineMål;
}

export interface AktivitetSet {
    repitisjoner: number;
}

export interface AktivitetØkt {
    aktivitetId: AktivitetID;
    set: AktivitetSet[];
}

export interface Økt {
    timestamp: string;
    aktivitetØkt: AktivitetØkt;
}

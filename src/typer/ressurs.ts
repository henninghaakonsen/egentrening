export enum RessursStatus {
    FEILET = 'FEILET',
    HENTER = 'HENTER',
    IKKE_HENTET = 'IKKE_HENTET',
    SUKSESS = 'SUKSESS',
}

export type Ressurs<T> =
    | {
          status: RessursStatus.IKKE_HENTET;
      }
    | {
          status: RessursStatus.HENTER;
      }
    | {
          data: T;
          status: RessursStatus.SUKSESS;
      }
    | {
          frontendFeilmelding: string;
          status: RessursStatus.FEILET;
      };

export const byggTomRessurs = <T>(): Ressurs<T> => {
    return {
        status: RessursStatus.IKKE_HENTET,
    };
};

export const byggDataRessurs = <T>(data: T): Ressurs<T> => {
    return {
        status: RessursStatus.SUKSESS,
        data,
    };
};

export const byggHenterRessurs = <T>(): Ressurs<T> => {
    return {
        status: RessursStatus.HENTER,
    };
};

export const byggFeiletRessurs = <T>(frontendFeilmelding: string): Ressurs<T> => {
    return {
        frontendFeilmelding,
        status: RessursStatus.FEILET,
    };
};

export const byggSuksessRessurs = <T>(data: T): Ressurs<T> => {
    return {
        data,
        status: RessursStatus.SUKSESS,
    };
};

export const hentDataFraRessurs = <T>(ressurs: Ressurs<T>): T | undefined => {
    return ressurs.status === RessursStatus.SUKSESS ? ressurs.data : undefined;
};

export const hentDataFraRessursMedFallback = <T>(ressurs: Ressurs<T>, fallbackData: T): T => {
    return ressurs.status === RessursStatus.SUKSESS ? ressurs.data : fallbackData;
};

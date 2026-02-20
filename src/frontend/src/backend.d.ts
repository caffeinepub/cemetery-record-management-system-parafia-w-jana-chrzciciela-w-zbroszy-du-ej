import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface PrayerForTheDeceased {
    title: string;
    content: string;
    memorialPrayer: string;
}
export type Time = bigint;
export interface PublicHtmlSection {
    title: string;
    content: string;
}
export interface PublicTileData {
    id: bigint;
    deceasedPersons: Array<DeceasedPerson>;
    status: GraveStatus;
    alley: string;
    plotNumber: bigint;
}
export interface GraveRecord {
    id: bigint;
    deceasedPersons: Array<DeceasedPerson>;
    status: GraveStatus;
    alley: string;
    paymentValidUntil?: Time;
    owner?: GraveOwner;
    plotNumber: bigint;
}
export interface PublicGraveResult {
    status: GraveStatus;
    alley: string;
    yearOfDeath?: bigint;
    plotNumber: bigint;
    lastName: string;
    firstName: string;
}
export interface PaginatedGravesResult {
    graves: Array<GraveRecord>;
    nextOffset?: bigint;
    pageSize: bigint;
    totalGraves: bigint;
}
export interface GraveOwner {
    address: string;
    phone?: string;
    lastName: string;
    firstName: string;
}
export type Error_ = {
    __kind__: "duplicateAlley";
    duplicateAlley: {
        alley: string;
    };
} | {
    __kind__: "graveNotFound";
    graveNotFound: {
        graveId: bigint;
    };
} | {
    __kind__: "invariantViolation";
    invariantViolation: {
        field: string;
    };
} | {
    __kind__: "alleyNotFound";
    alleyNotFound: {
        alley: string;
    };
} | {
    __kind__: "inconsistentAlleyGraves";
    inconsistentAlleyGraves: {
        alley: string;
        graveId: bigint;
    };
} | {
    __kind__: "unauthorized";
    unauthorized: null;
} | {
    __kind__: "alleyNotEmpty";
    alleyNotEmpty: {
        alley: string;
    };
};
export interface ParishFooterContent {
    bankAccountNumber: string;
    websiteUrl: string;
    xUrl: string;
    oneSentenceDescription: string;
    email: string;
    parishName: string;
    fullAddress: string;
    phoneNumber: string;
    massTimes: string;
    youtubeUrl: string;
    facebookUrl: string;
    bibleQuote: string;
}
export interface DeceasedPerson {
    placeOfDeath: string;
    yearOfDeath: bigint;
    dateOfDeath?: Time;
    lastName: string;
    firstName: string;
}
export interface CemeteryView {
    cemeteryName: string;
    lastGraveId: bigint;
    alleys: Array<AlleyView>;
}
export type AsyncResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface PublicGraveShape {
    status: GraveStatus;
    yearOfDeath?: bigint;
    lastName: string;
    firstName: string;
}
export interface HomepageHeroContent {
    backgroundImageUrl: string;
    logoImage?: ExternalBlob;
    headline: string;
    heroBackgroundImage?: ExternalBlob;
    introParagraph: string;
}
export type AsyncResult_1 = {
    __kind__: "ok";
    ok: bigint;
} | {
    __kind__: "err";
    err: Error_;
};
export interface SiteContent {
    logoImage?: ExternalBlob;
    cemeteryInformation: PublicHtmlSection;
    parishFooter: ParishFooterContent;
    prayerForTheDeceased: PrayerForTheDeceased;
    gravesDeclaration: PublicHtmlSection;
    homepageHero: HomepageHeroContent;
}
export interface AlleyView {
    name: string;
    graveIds: Array<bigint>;
}
export interface UserProfile {
    name: string;
    email?: string;
}
export enum GraveStatus {
    free = "free",
    paid = "paid",
    reserved = "reserved",
    unpaid = "unpaid"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAlley(name: string): Promise<AsyncResult>;
    addGrave(alley: string, plotNumber: bigint): Promise<AsyncResult_1>;
    addManager(principal: Principal): Promise<boolean>;
    assignBoss(newBoss: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearManagers(): Promise<void>;
    getAccessRole(): Promise<string>;
    getAllGraves(): Promise<Array<GraveRecord>>;
    getAvailableGraves(): Promise<Array<GraveRecord>>;
    getBoss(): Promise<Principal | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCemeteryInformation(): Promise<PublicHtmlSection>;
    getCemeteryState(): Promise<CemeteryView>;
    getCemeteryStateWithoutVerification(): Promise<CemeteryView>;
    getGrave(id: bigint): Promise<GraveRecord | null>;
    getGraveStatistics(): Promise<{
        total: bigint;
        free: bigint;
        paid: bigint;
        reserved: bigint;
        unpaid: bigint;
    }>;
    getGravesByAlley(alley: string): Promise<Array<GraveRecord>>;
    getGravesDeclaration(): Promise<PublicHtmlSection>;
    getHomepageHeroContent(): Promise<HomepageHeroContent>;
    getManagers(): Promise<Array<Principal>>;
    getPaginatedGraves(offset: bigint, pageSize: bigint): Promise<PaginatedGravesResult>;
    getParishContactEmail(): Promise<string>;
    getParishFooterContent(): Promise<ParishFooterContent>;
    getPrayerForTheDeceased(): Promise<PrayerForTheDeceased>;
    getPublicGraves(): Promise<Array<PublicGraveShape>>;
    getPublicTiles(): Promise<Array<PublicTileData>>;
    getSiteContent(): Promise<SiteContent>;
    getSurnamesForAutocomplete(): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    healthCheck(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isManager(principal: Principal): Promise<boolean>;
    isPermanentBoss(): Promise<boolean>;
    removeAlley(name: string): Promise<AsyncResult>;
    removeGrave(id: bigint): Promise<AsyncResult>;
    removeManager(principal: Principal): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchGraves(surname: string | null, yearOfDeath: bigint | null, owner: string | null, status: GraveStatus | null, locality: string | null): Promise<Array<GraveRecord>>;
    searchPublicGraves(surname: string | null, yearOfDeath: bigint | null, owner: string | null, status: GraveStatus | null, locality: string | null): Promise<Array<PublicGraveResult>>;
    searchPublicGravesWithLocation(surname: string | null, yearOfDeath: bigint | null): Promise<Array<PublicGraveResult>>;
    updateCemeteryInformation(newSection: PublicHtmlSection): Promise<void>;
    updateGrave(id: bigint, updatedRecord: GraveRecord): Promise<AsyncResult>;
    updateGravesDeclaration(newSection: PublicHtmlSection): Promise<void>;
    updateHomepageHeroContent(newContent: HomepageHeroContent): Promise<void>;
    updateLogoImage(newLogo: ExternalBlob | null): Promise<void>;
    updateParishFooterContent(newFooterContent: ParishFooterContent): Promise<void>;
    updatePrayerForTheDeceased(newSection: PrayerForTheDeceased): Promise<void>;
    updateSiteContent(newContent: SiteContent): Promise<void>;
}

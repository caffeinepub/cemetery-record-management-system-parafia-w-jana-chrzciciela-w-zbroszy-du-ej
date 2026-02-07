import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

module {
  // Old Persistent Types (From Old Actor)
  type OldHomepageHeroContent = {
    headline : Text;
    introParagraph : Text;
    backgroundImageUrl : Text;
    heroBackgroundImage : ?Storage.ExternalBlob;
    logoImage : ?Storage.ExternalBlob;
  };

  type OldFooterContent = {
    address : Text;
    phoneNumber : Text;
    email : Text;
    officeHours : Text;
    bankAccountNumber : Text;
    websiteLink : Text;
  };

  // Old Persistent content (home page, footer, etc.)
  type OldSiteContent = {
    homepageHero : OldHomepageHeroContent;
    footer : OldFooterContent;
    logoImage : ?Storage.ExternalBlob;
    gravesDeclaration : PublicHtmlSection;
    prayerForTheDeceased : PublicHtmlSection;
  };

  type PublicHtmlSection = {
    title : Text;
    content : Text;
  };

  type OldActor = {
    // Other state variables...
    graveRecords : Map.Map<Nat, GraveRecord>;
    userProfiles : Map.Map<Principal, UserProfile>;
    alleysState : List.List<Alley>;
    lastGraveIdState : Nat;
    cemeteryNameState : Text;
    adminEmail : Text;
    siteContentState : OldSiteContent;
    accessControlState : AccessControl.AccessControlState;
  };

  // New Persistent content with cemeteryInformation
  type HomepageHeroContent = {
    headline : Text;
    introParagraph : Text;
    backgroundImageUrl : Text;
    heroBackgroundImage : ?Storage.ExternalBlob;
    logoImage : ?Storage.ExternalBlob;
  };

  type FooterContent = {
    address : Text;
    phoneNumber : Text;
    email : Text;
    officeHours : Text;
    bankAccountNumber : Text;
    websiteLink : Text;
  };

  type NewSiteContent = {
    homepageHero : HomepageHeroContent;
    footer : FooterContent;
    logoImage : ?Storage.ExternalBlob;
    gravesDeclaration : PublicHtmlSection;
    prayerForTheDeceased : PublicHtmlSection;
    cemeteryInformation : PublicHtmlSection;
  };

  type DeceasedPerson = {
    firstName : Text;
    lastName : Text;
    dateOfDeath : ?Int;
    yearOfDeath : Int;
    placeOfDeath : Text;
  };

  type GraveOwner = {
    firstName : Text;
    lastName : Text;
    address : Text;
    phone : ?Text;
  };

  type GraveStatus = { #paid; #unpaid; #free; #reserved };

  type GraveRecord = {
    id : Nat;
    alley : Text;
    plotNumber : Nat;
    owner : ?GraveOwner;
    status : GraveStatus;
    paymentValidUntil : ?Int;
    deceasedPersons : [DeceasedPerson];
  };

  type Alley = {
    name : Text;
    graveIds : Set.Set<Nat>;
  };

  type UserProfile = {
    name : Text;
    email : ?Text;
  };

  type NewActor = {
    graveRecords : Map.Map<Nat, GraveRecord>;
    userProfiles : Map.Map<Principal, UserProfile>;
    alleysState : List.List<Alley>;
    lastGraveIdState : Nat;
    cemeteryNameState : Text;
    adminEmail : Text;
    siteContentState : NewSiteContent;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    // Initialize default value for cemeteryInformation section
    let defaultCemeteryInformation = {
      title = "O naszym cmentarzu";
      content = "Cmentarz parafialny w Zbroszy Dużej to miejsce pamięci, zadumy i modlitwy za wszystkich parafian. ";
    };

    // Create new site content with persistent cemeteryInformation
    let newSiteContent : NewSiteContent = {
      old.siteContentState with
      cemeteryInformation = defaultCemeteryInformation;
    };

    { old with siteContentState = newSiteContent };
  };
};

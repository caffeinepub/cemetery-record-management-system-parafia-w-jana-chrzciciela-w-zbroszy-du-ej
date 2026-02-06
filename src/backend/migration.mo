module {
  type PublicHtmlSection = {
    title : Text;
    content : Text;
  };

  type OldSiteContent = {
    homepageHero : {
      headline : Text;
      introParagraph : Text;
      backgroundImageUrl : Text;
      heroBackgroundImage : ?Blob;
      logoImage : ?Blob;
    };
    footer : {
      address : Text;
      phoneNumber : Text;
      email : Text;
      officeHours : Text;
      bankAccountNumber : Text;
      websiteLink : Text;
    };
    logoImage : ?Blob;
    gravesDeclaration : PublicHtmlSection;
    prayerForTheDeceased : PublicHtmlSection;
    cemeteryInformation : PublicHtmlSection;
  };

  type NewSiteContent = {
    homepageHero : {
      headline : Text;
      introParagraph : Text;
      backgroundImageUrl : Text;
      heroBackgroundImage : ?Blob;
      logoImage : ?Blob;
    };
    footer : {
      address : Text;
      phoneNumber : Text;
      email : Text;
      officeHours : Text;
      bankAccountNumber : Text;
      websiteLink : Text;
    };
    logoImage : ?Blob;
    gravesDeclaration : PublicHtmlSection;
    prayerForTheDeceased : PublicHtmlSection;
    cemeteryInformation : PublicHtmlSection;
    searchDisclaimer : PublicHtmlSection;
  };

  type OldActor = {
    siteContentState : OldSiteContent;
    // Other existing stable variables
  };

  type NewActor = {
    siteContentState : NewSiteContent;
    // Other existing stable variables
  };

  public func run(old : OldActor) : NewActor {
    let newSiteContent : NewSiteContent = {
      old.siteContentState with
      searchDisclaimer = {
        title = "Ostrzeżenie o publicznym udostępnianiu";
        content = "Wszystkie dane pochodzą ze źródeł publicznych (w tym z nagrobków). Jeśli życzą sobie państwo usunięcia lub korekty danych, prosimy o kontakt z nami na adres mailowy lub telefonicznie napisane w stopce powyżej. Nie chcesz bowiem śmierci grzesznika, lecz pragniesz, by ludzie się nawracali i mieli życie wieczne.";
      };
    };
    { old with siteContentState = newSiteContent };
  };
};

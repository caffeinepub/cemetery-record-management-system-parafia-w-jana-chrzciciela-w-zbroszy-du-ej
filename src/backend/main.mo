import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Set "mo:core/Set";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  type DeceasedPerson = {
    firstName : Text;
    lastName : Text;
    dateOfDeath : ?Time.Time;
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

  public type GraveRecord = {
    id : Nat;
    alley : Text;
    plotNumber : Nat;
    owner : ?GraveOwner;
    status : GraveStatus;
    paymentValidUntil : ?Time.Time;
    deceasedPersons : [DeceasedPerson];
  };

  type PublicGraveShape = {
    firstName : Text;
    lastName : Text;
    yearOfDeath : ?Int;
    status : GraveStatus;
  };

  public type PublicTileData = {
    id : Nat;
    alley : Text;
    plotNumber : Nat;
    status : GraveStatus;
    deceasedPersons : [DeceasedPerson];
  };

  type Alley = {
    name : Text;
    graveIds : Set.Set<Nat>;
  };

  type CemeteryState = {
    cemeteryName : Text;
    alleys : [Alley];
    lastGraveId : Nat;
  };

  public type AlleyView = { name : Text; graveIds : [Nat] };
  public type CemeteryView = {
    cemeteryName : Text;
    alleys : [AlleyView];
    lastGraveId : Nat;
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
  };

  public type PaginatedGravesResult = {
    graves : [GraveRecord];
    totalGraves : Nat;
    pageSize : Nat;
    nextOffset : ?Nat;
  };

  public type AsyncResult<T> = {
    #ok : T;
    #err : Error;
  };

  // Types for homepage and footer content
  public type HomepageHeroContent = {
    headline : Text;
    introParagraph : Text;
    backgroundImageUrl : Text;
    heroBackgroundImage : ?Storage.ExternalBlob;
    logoImage : ?Storage.ExternalBlob;
  };

  public type FooterContent = {
    address : Text;
    phoneNumber : Text;
    email : Text;
    officeHours : Text;
    bankAccountNumber : Text;
    websiteLink : Text;
  };

  // NEW: Extended persistent site content type with new public homepage section fields.
  public type SiteContent = {
    homepageHero : HomepageHeroContent;
    footer : FooterContent;
    logoImage : ?Storage.ExternalBlob;
    // NEW public homepage sections -- orzeczenie and prayerForTheDeceased
    gravesDeclaration : PublicHtmlSection;
    prayerForTheDeceased : PublicHtmlSection;
    cemeteryInformation : PublicHtmlSection;
    searchDisclaimer : PublicHtmlSection;
  };

  // NEW: Persistent site-managed HTML content section (for WYSIWYG fields)
  public type PublicHtmlSection = {
    title : Text;
    content : Text; // Persistently stored WYSIWYG content;
  };

  module GraveRecord {
    public func compare(record1 : GraveRecord, record2 : GraveRecord) : Order.Order {
      switch (Text.compare(record1.alley, record2.alley)) {
        case (#equal) { Nat.compare(record1.plotNumber, record2.plotNumber) };
        case (order) { order };
      };
    };

    public func compareByLastName(record1 : GraveRecord, record2 : GraveRecord) : Order.Order {
      if (record1.deceasedPersons.size() == 0 or record2.deceasedPersons.size() == 0) {
        return #equal;
      };
      let person1 = record1.deceasedPersons[0];
      let person2 = record2.deceasedPersons[0];
      switch (Text.compare(person1.lastName, person2.lastName)) {
        case (#equal) { person1.firstName.compare(person2.firstName) };
        case (order) { order };
      };
    };
  };

  module DeceasedPerson {
    public func compare(person1 : DeceasedPerson, person2 : DeceasedPerson) : Order.Order {
      switch (Text.compare(person1.lastName, person2.lastName)) {
        case (#equal) { person1.firstName.compare(person2.firstName) };
        case (order) { order };
      };
    };

    public func compareByYearOfDeath(person1 : DeceasedPerson, person2 : DeceasedPerson) : Order.Order {
      Int.compare(person1.yearOfDeath, person2.yearOfDeath);
    };
  };

  module Error {
    public type Error = {
      #alleyNotFound : { alley : Text };
      #alleyNotEmpty : { alley : Text };
      #duplicateAlley : { alley : Text };
      #graveNotFound : { graveId : Nat };
      #inconsistentAlleyGraves : { alley : Text; graveId : Nat };
      #invariantViolation : { field : Text };
    };
  };
  type Error = Error.Error;

  // Grave records state
  let graveRecords = Map.empty<Nat, GraveRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();

  var alleysState = List.empty<Alley>();
  var lastGraveIdState = 0;
  var cemeteryNameState = "Parafia św. Jana Chrzciciela w Zbroszy Dużej";
  var adminEmail = "zbroszaduza@archidiecezja.waw.pl";

  var siteContentState : SiteContent = {
    homepageHero = {
      headline = "Parafia św. Jana Chrzciciela w Zbroszy Dużej";
      introParagraph = "Nasza parafia prowadzi cmentarz katolicki, w którym spoczywają nasi bliscy zmarli i parafianie. Zachęcamy do korzystania z dostępnej bazy grobów, dzięki której mogą Państwo odnaleźć lokalizację grobu, sprawdzić szczegółowe informacje oraz zarządzać należnościami związanymi z utrzymaniem miejsc na naszym cmentarzu."
      # "Dbajmy wspólnie o godne miejsce wiecznego spoczynku, a także o pamięć o naszych bliskich zmarłych. Zachęcamy do kontaktu z kancelarią parafialną w celu uzyskania wszelkich niezbędnych informacji oraz pomocy w sprawach cmentarnych. ";

      backgroundImageUrl = "/assets/hero_bg.png";
      heroBackgroundImage = null;
      logoImage = null;
    };

    footer = {
      address = "Zbrosza Duża 57, 05-650 Chynów";
      phoneNumber = "+48 48 662 70 01";
      email = "zbroszaduza@archidiecezja.waw.pl";
      officeHours = "Poniedziałek, czwartek i piątek w godz. 16.30-18.00";
      bankAccountNumber = "Bank Pekao S.A. 06 1240 3259 1111 0010 7422 2925";
      websiteLink = "https://zbroszaduza.parafialnastrona.pl/";
    };

    // New Persistent design system fields", with explanations
    // Human language: These are persistent\site-stored version of the previously hardcoded public homepage sections about cemetery and prayer. They allow managers to edit these sections instead of having code-embedded text.
    gravesDeclaration = {
      title = "Orzeczenie cmentarza parafialnego";
      content = "Według prawa kościelnego cmentarz kościelny jest miejscem wyjętym spod jurysdykcji świeckiej... (extend full content as needed)";
    };
    prayerForTheDeceased = {
      title = "Modlitwa za zmarłych";
      content = "Wieczny odpoczynek racz im dać, Panie...\nA światłość wiekuista niechaj im świeci...";
    };
    logoImage = null;
    cemeteryInformation = {
      title = "O naszym cmentarzu";
      content = "Cmentarz parafialny znajduje się w Zbroszy Dużej (polska_q64) blisko kościoła. Jest to miejsce szczególnej pamięci o zmarłych i złączenia z całą wspólnotą kościoła. ";
    };
    searchDisclaimer = {
      title = "Ostrzeżenie o publicznym udostępnianiu";
      content = "Wszystkie dane pochodzą ze źródeł publicznych (w tym z nagrobków). Jeśli życzą sobie państwo usunięcia lub korekty danych, prosimy o kontakt z nami "
      # "na adres mailowy lub telefonicznie napisane w stopce powyżej.\n\n\"Nie chcesz bowiem śmierci grzesznika, lecz pragniesz, "
      # "by ludzie się nawracali i mieli życie wieczne\" ";
    };
  };

  func verifyDataConsistency() : () {
    let validGraveRecordIds = graveRecords.toArray().map(func((id, _)) { id });
    let validIdsSet = Set.fromArray<Nat>(validGraveRecordIds);

    let alleyArray = alleysState.toArray();
    for (alley in alleyArray.values()) {
      for (id in alley.graveIds.values()) {
        if (not validIdsSet.contains(id)) {
          Runtime.trap("Invalid reference to non-existent grave id " # id.toText() # " from alley " # alley.name);
        };
      };
    };

    let linkedIdsSet = Set.empty<Nat>();

    for (alley in alleyArray.values()) {
      for (id in alley.graveIds.values()) {
        if (linkedIdsSet.contains(id)) {
          Runtime.trap("Cemetery state is invalid: Duplicate reference to grave id " # id.toText() # " in alley " # alley.name);
        } else {
          linkedIdsSet.add(id);
        };
      };
    };

    let graveIdExists = func(ids : Set.Set<Nat>, id : Nat) : Bool {
      ids.contains(id);
    };

    for ((id, grave) in graveRecords.entries()) {
      let index = alleyArray.findIndex(
        func(alley) { (alley.name == grave.alley) and graveIdExists(alley.graveIds, id) }
      );
      switch (index) {
        case (null) {
          Runtime.trap("Cemetery state is invalid: Grave id " # id.toText() # " not found in any alley for its position (" # grave.alley # ")");
        };
        case (?_found) {};
      };
    };
  };

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // -- Persistent Site Content API ----

  // PUBLIC getter for full persistent site content, including all site-managed fields (logo, hero, footer, public sections etc.)
  public query ({ caller }) func getSiteContent() : async SiteContent {
    siteContentState;
  };

  // Admin-only persistent section update methods.
  public shared ({ caller }) func updateSiteContent(newContent : SiteContent) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update site content");
    };
    siteContentState := newContent;
  };

  public shared ({ caller }) func updateLogoImage(newLogo : ?Storage.ExternalBlob) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update logo image");
    };
    siteContentState := { siteContentState with logoImage = newLogo };
  };

  public query ({ caller }) func getHomepageHeroContent() : async HomepageHeroContent {
    siteContentState.homepageHero;
  };

  public shared ({ caller }) func updateHomepageHeroContent(newContent : HomepageHeroContent) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update homepage content");
    };

    siteContentState := {
      siteContentState with homepageHero = {
        newContent with
        logoImage = siteContentState.logoImage;
      };
      logoImage = siteContentState.logoImage;
    };
  };

  public query ({ caller }) func getFooterContent() : async FooterContent {
    siteContentState.footer;
  };

  public shared ({ caller }) func updateFooterContent(newFooterContent : FooterContent) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update footer content");
    };
    siteContentState := { siteContentState with footer = newFooterContent };
  };

  // PUBLIC persistent HTML section getters (used to render the public homepage).
  public query ({ caller }) func getGravesDeclaration() : async PublicHtmlSection {
    siteContentState.gravesDeclaration;
  };

  public query ({ caller }) func getPrayerForTheDeceased() : async PublicHtmlSection {
    siteContentState.prayerForTheDeceased;
  };

  public query ({ caller }) func getCemeteryInformation() : async PublicHtmlSection {
    siteContentState.cemeteryInformation;
  };

  // NEW: Public API for search disclaimer (called on public search page).
  public query ({ caller }) func getSearchDisclaimer() : async PublicHtmlSection {
    siteContentState.searchDisclaimer;
  };

  // Admin-only public section update methods (called through the management panel).
  public shared ({ caller }) func updateGravesDeclaration(newSection : PublicHtmlSection) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update persistent section");
    };
    siteContentState := { siteContentState with gravesDeclaration = newSection };
  };

  public shared ({ caller }) func updatePrayerForTheDeceased(newSection : PublicHtmlSection) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update persistent section");
    };
    siteContentState := { siteContentState with prayerForTheDeceased = newSection };
  };

  public shared ({ caller }) func updateCemeteryInformation(newSection : PublicHtmlSection) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update persistent section");
    };
    siteContentState := { siteContentState with cemeteryInformation = newSection };
  };

  // Admin-only persistent update for search disclaimer section.
  public shared ({ caller }) func updateSearchDisclaimer(newSection : PublicHtmlSection) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update persistent section");
    };
    siteContentState := { siteContentState with searchDisclaimer = newSection };
  };

  // Persistent admin business logic.

  // Public API to fetch the admin email (for contact form)
  public query ({ caller }) func getParishContactEmail() : async Text {
    adminEmail;
  };

  public query func getCemeteryState() : async CemeteryView {
    verifyDataConsistency();
    {
      cemeteryName = cemeteryNameState;
      alleys = alleysState.toArray().map(
        func(alley) {
          { name = alley.name; graveIds = alley.graveIds.toArray() };
        }
      );
      lastGraveId = lastGraveIdState;
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or be an admin");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addAlley(name : Text) : async AsyncResult<()> {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add alleys");
    };

    let existingAlley = alleysState.find(func(a : Alley) : Bool { a.name == name });
    switch (existingAlley) {
      case (?_) {
        #err(#duplicateAlley({ alley = name }));
      };
      case (null) {
        let newAlley : Alley = {
          name;
          graveIds = Set.empty<Nat>();
        };
        alleysState.add(newAlley);
        #ok(());
      };
    };
  };

  public shared ({ caller }) func removeAlley(name : Text) : async AsyncResult<()> {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove alleys");
    };

    let alleyToRemoveOpt = alleysState.find(func(a : Alley) : Bool { a.name == name });
    switch (alleyToRemoveOpt) {
      case (?alley) {
        if (alley.graveIds.size() > 0) {
          return #err(#alleyNotEmpty({ alley = name }));
        };
      };
      case (null) {
        return #err(#alleyNotFound({ alley = name }));
      };
    };

    let filteredAlleys = alleysState.filter(func(a : Alley) : Bool { a.name != name });
    alleysState.clear();
    for (alley in filteredAlleys.values()) {
      alleysState.add(alley);
    };
    #ok(());
  };

  public shared ({ caller }) func addGrave(alley : Text, plotNumber : Nat) : async AsyncResult<Nat> {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add graves");
    };

    let matchingAlley = alleysState.find(func(a : Alley) : Bool { a.name == alley });
    switch (matchingAlley) {
      case (?_) {
        let newGraveId = lastGraveIdState + 1;
        let newGrave : GraveRecord = {
          id = newGraveId;
          alley;
          plotNumber;
          owner = null;
          status = #free;
          paymentValidUntil = null;
          deceasedPersons = [];
        };
        graveRecords.add(newGraveId, newGrave);

        let alleyArray = alleysState.toArray();
        let updatedAlleys = alleyArray.map(
          func(a : Alley) : Alley {
            if (a.name == alley) {
              let newGraveIds = Set.empty<Nat>();
              a.graveIds.values().forEach(func(id) { newGraveIds.add(id) });
              newGraveIds.add(newGraveId);
              { a with graveIds = newGraveIds };
            } else {
              a;
            };
          }
        );

        alleysState.clear();
        for (alley in updatedAlleys.values()) {
          alleysState.add(alley);
        };

        lastGraveIdState := newGraveId;
        #ok(newGraveId);
      };
      case (null) {
        #err(#alleyNotFound({ alley }));
      };
    };
  };

  public shared ({ caller }) func removeGrave(id : Nat) : async AsyncResult<()> {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove graves");
    };

    switch (graveRecords.get(id)) {
      case (?grave) {
        if (grave.status != #free) {
          return #err(#invariantViolation({ field = "status" }));
        };

        graveRecords.remove(id);

        let alleyArray = alleysState.toArray();
        let updatedAlleys = alleyArray.map(
          func(a : Alley) : Alley {
            if (a.name == grave.alley) {
              let newGraveIds = Set.empty<Nat>();
              a.graveIds.values().forEach(func(graveId) {
                if (graveId != id) { newGraveIds.add(graveId) };
              });
              { a with graveIds = newGraveIds };
            } else {
              a;
            };
          }
        );

        alleysState.clear();
        for (alley in updatedAlleys.values()) {
          alleysState.add(alley);
        };
        #ok(());
      };
      case (null) {
        #err(#graveNotFound({ graveId = id }));
      };
    };
  };

  public shared ({ caller }) func updateGrave(id : Nat, updatedRecord : GraveRecord) : async AsyncResult<()> {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update graves");
    };

    if (not graveRecords.containsKey(id)) {
      return #err(#graveNotFound({ graveId = id }));
    };

    if (updatedRecord.id != id) {
      return #err(#invariantViolation({ field = "id" }));
    };

    let existingRecordOpt = graveRecords.get(id);
    switch (existingRecordOpt) {
      case (?storedRecord) {
        if (updatedRecord.alley != storedRecord.alley) {
          return #err(#invariantViolation({ field = "alley" }));
        };
        if (updatedRecord.plotNumber != storedRecord.plotNumber) {
          return #err(#invariantViolation({ field = "plotNumber" }));
        };

        let alleyOpt = alleysState.find(func(a : Alley) : Bool { a.name == storedRecord.alley });
        switch (alleyOpt) {
          case (null) {
            return #err(#invariantViolation({ field = "alley" }));
          };
          case (?alley) {
            if (not alley.graveIds.contains(id)) {
              return #err(#inconsistentAlleyGraves({ alley = storedRecord.alley; graveId = id }));
            };

            graveRecords.add(id, updatedRecord);
            #ok(());
          };
        };
      };
      case (null) {
        #err(#graveNotFound({ graveId = id }));
      };
    };
  };

  public query ({ caller }) func searchGraves(
    surname : ?Text,
    yearOfDeath : ?Int,
    owner : ?Text,
    status : ?GraveStatus,
    locality : ?Text,
  ) : async [GraveRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access full grave records");
    };

    let filtered = graveRecords.values().toArray().filter(
      func(grave : GraveRecord) : Bool {
        switch (surname) {
          case (?s) {
            if (grave.deceasedPersons.size() == 0) {
              return false;
            };
            let found = grave.deceasedPersons.find(
              func(person : DeceasedPerson) : Bool {
                person.lastName.contains(#text s);
              }
            );
            switch (found) {
              case (?_) {};
              case (null) { return false };
            };
          };
          case (null) {};
        };

        switch (yearOfDeath) {
          case (?year) {
            if (grave.deceasedPersons.size() == 0) {
              return false;
            };
            let found = grave.deceasedPersons.find(
              func(person : DeceasedPerson) : Bool {
                person.yearOfDeath == year;
              }
            );
            switch (found) {
              case (?_) {};
              case (null) { return false };
            };
          };
          case (null) {};
        };

        switch (owner) {
          case (?o) {
            switch (grave.owner) {
              case (?own) {
                if (not own.lastName.contains(#text o)) { return false };
              };
              case (null) { return false };
            };
          };
          case (null) {};
        };

        switch (status) {
          case (?s) {
            if (grave.status != s) {
              return false;
            };
          };
          case (null) {};
        };

        switch (locality) {
          case (?l) {
            switch (grave.owner) {
              case (?own) {
                if (not own.address.contains(#text l)) { return false };
              };
              case (null) { return false };
            };
          };
          case (null) {};
        };

        return true;
      }
    );

    filtered;
  };

  public query ({ caller }) func getGrave(id : Nat) : async ?GraveRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access full grave records");
    };
    graveRecords.get(id);
  };

  public query func getCemeteryStateWithoutVerification() : async CemeteryView {
    {
      cemeteryName = cemeteryNameState;
      alleys = alleysState.toArray().map(
        func(alley) {
          { name = alley.name; graveIds = alley.graveIds.toArray() };
        }
      );
      lastGraveId = lastGraveIdState;
    };
  };

  public query ({ caller }) func getAllGraves() : async [GraveRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access full grave records");
    };
    graveRecords.values().toArray().sort();
  };

  public query ({ caller }) func getGravesByAlley(alley : Text) : async [GraveRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access full grave records");
    };
    graveRecords.values().toArray().filter(
      func(grave : GraveRecord) : Bool { grave.alley == alley }
    ).sort();
  };

  public query ({ caller }) func getAvailableGraves() : async [GraveRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access full grave records");
    };
    graveRecords.values().toArray().filter(
      func(grave : GraveRecord) : Bool { grave.status == #free }
    ).sort();
  };

  public query ({ caller }) func getPaginatedGraves(offset : Nat, pageSize : Nat) : async PaginatedGravesResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access full grave records");
    };

    let orderedGraves = graveRecords.values().toArray().sort();
    let totalGraves = orderedGraves.size();

    let start = offset;
    let end = Nat.min(start + pageSize, totalGraves);

    let pageGraves = if (start < end) {
      orderedGraves.sliceToArray(start, end);
    } else {
      [];
    };

    let nextOffset = if (end < totalGraves) { ?end } else { null };

    {
      graves = pageGraves;
      totalGraves;
      pageSize;
      nextOffset;
    };
  };

  public query func getGraveStatistics() : async {
    total : Nat;
    paid : Nat;
    unpaid : Nat;
    free : Nat;
    reserved : Nat;
  } {
    var paid = 0;
    var unpaid = 0;
    var free = 0;
    var reserved = 0;

    for (grave in graveRecords.values()) {
      switch (grave.status) {
        case (#paid) { paid += 1 };
        case (#unpaid) { unpaid += 1 };
        case (#free) { free += 1 };
        case (#reserved) { reserved += 1 };
      };
    };

    {
      total = graveRecords.size();
      paid;
      unpaid;
      free;
      reserved;
    };
  };

  public query func getSurnamesForAutocomplete() : async [Text] {
    let surnames = Map.empty<Text, ()>();
    for (grave in graveRecords.values()) {
      for (person in grave.deceasedPersons.vals()) {
        surnames.add(person.lastName, ());
      };
    };
    surnames.keys().toArray().sort();
  };

  public query func getPublicGraves() : async [PublicGraveShape] {
    Array.fromIter(
      graveRecords.values().flatMap(
        func(grave) {
          grave.deceasedPersons.values().flatMap(
            func(person) {
              [{ firstName = person.firstName; lastName = person.lastName; yearOfDeath = if (person.yearOfDeath > 0) { ?(person.yearOfDeath) } else { null }; status = grave.status }].values();
            }
          );
        }
      )
    );
  };

  public query func getPublicGravesByAlley(alley : Text) : async [PublicGraveShape] {
    Array.fromIter(
      graveRecords.values().flatMap(
        func(grave) {
          if (grave.alley == alley) {
            grave.deceasedPersons.values().flatMap(
              func(person) {
                [{ firstName = person.firstName; lastName = person.lastName; yearOfDeath = if (person.yearOfDeath > 0) { ?(person.yearOfDeath) } else { null }; status = grave.status }].values();
              }
            );
          } else {
            [].values();
          };
        }
      )
    );
  };

  public query func searchPublicGraves(surname : ?Text, yearOfDeath : ?Int) : async [PublicGraveShape] {
    Array.fromIter(
      graveRecords.values().flatMap(
        func(grave) {
          grave.deceasedPersons.values().flatMap(
            func(person) {
              var matches = true;

              switch (surname, yearOfDeath) {
                case (?name, ?year) {
                  let nameMatches = person.lastName.contains(#text name);
                  let yearMatches = person.yearOfDeath == year;
                  matches := nameMatches and yearMatches;
                };
                case (?name, null) {
                  matches := person.lastName.contains(#text name);
                };
                case (null, ?year) {
                  matches := person.yearOfDeath == year;
                };
                case (null, null) { matches := true };
              };

              if (matches) {
                [{ firstName = person.firstName; lastName = person.lastName; yearOfDeath = if (person.yearOfDeath > 0) { ?(person.yearOfDeath) } else { null }; status = grave.status }].values();
              } else { [].values() };
            }
          );
        }
      )
    );
  };

  public query func getPublicTiles() : async [PublicTileData] {
    graveRecords.values().toArray().map(
      func(graveRecord) {
        {
          id = graveRecord.id;
          alley = graveRecord.alley;
          plotNumber = graveRecord.plotNumber;
          status = graveRecord.status;
          deceasedPersons = graveRecord.deceasedPersons;
        };
      }
    );
  };
};

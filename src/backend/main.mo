import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Set "mo:core/Set";

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

  public type PublicGraveResult = {
    firstName : Text;
    lastName : Text;
    alley : Text;
    plotNumber : Nat;
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

  public type SiteContent = {
    homepageHero : HomepageHeroContent;
    footer : FooterContent;
    logoImage : ?Storage.ExternalBlob;
    gravesDeclaration : PublicHtmlSection;
    prayerForTheDeceased : PrayerForTheDeceased;
    cemeteryInformation : PublicHtmlSection;
  };

  public type PublicHtmlSection = {
    title : Text;
    content : Text;
  };

  // New type for Prayer For The Deceased
  public type PrayerForTheDeceased = {
    title : Text;
    content : Text;
    memorialPrayer : Text; // New field for memorial prayer content
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
      #unauthorized;
      #alleyNotFound : { alley : Text };
      #alleyNotEmpty : { alley : Text };
      #duplicateAlley : { alley : Text };
      #graveNotFound : { graveId : Nat };
      #inconsistentAlleyGraves : { alley : Text; graveId : Nat };
      #invariantViolation : { field : Text };
    };
  };
  type Error = Error.Error;

  // Boss principal - the first authenticated user becomes the permanent Boss
  var boss : ?Principal = null;

  // Grave records state
  let graveRecords = Map.empty<Nat, GraveRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var accessControlState = AccessControl.initState();

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

    gravesDeclaration = {
      title = "Orzeczenie cmentarza parafialnego";
      content = "Według prawa kościelnego cmentarz kościelny jest miejscem wyjętym spod jurysdykcji świeckiej... (extend full content as needed)";
    };

    // Updated Prayer For The Deceased with new field
    prayerForTheDeceased = {
      title = "Modlitwa za zmarłych";
      content = "Wieczny odpoczynek racz im dać, Panie...\nA światłość wiekuista niechaj im świeci...";
      memorialPrayer = ""; // Initialize as empty text
    };

    logoImage = null;
    cemeteryInformation = {
      title = "O naszym cmentarzu";
      content = "Cmentarz parafialny znajduje się w Zbroszy Dużej (polska_q64) blisko kościoła. Jest to miejsce szczególnej pamięci o zmarłych i złączenia z całą wspólnotą kościoła. ";
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

  // -- Permanent Boss Authorization Logic ----
  func ensureBossAssigned(caller : Principal) : () {
    if (caller.isAnonymous()) {
      return; // Anonymous users never become Boss
    };

    switch (boss) {
      case (null) {
        // First authenticated user becomes the Boss
        boss := ?caller;
      };
      case (?_) {
        // Boss already assigned, do nothing
      };
    };
  };

  func isPermanentBoss(caller : Principal) : Bool {
    if (caller.isAnonymous()) {
      return false;
    };

    // Ensure Boss is assigned if not yet set
    ensureBossAssigned(caller);

    switch (boss) {
      case (?storedBoss) { storedBoss == caller };
      case (null) { false }; // Should not happen after ensureBossAssigned
    };
  };

  func assertPermanentBoss(caller : Principal) : () {
    if (not isPermanentBoss(caller)) {
      Runtime.trap("Unauthorized: Only the Boss can perform this action");
    };
  };

  // -- Persistent Site Content API ----

  // PUBLIC getter for full persistent site content, including all site-managed fields (logo, hero, footer, public sections etc.)
  public query ({ caller }) func getSiteContent() : async SiteContent {
    siteContentState;
  };

  // Boss-only persistent section update methods.
  public shared ({ caller }) func updateSiteContent(newContent : SiteContent) : async () {
    assertPermanentBoss(caller);
    siteContentState := newContent;
  };

  public shared ({ caller }) func updateLogoImage(newLogo : ?Storage.ExternalBlob) : async () {
    assertPermanentBoss(caller);
    siteContentState := { siteContentState with logoImage = newLogo };
  };

  public query ({ caller }) func getHomepageHeroContent() : async HomepageHeroContent {
    siteContentState.homepageHero;
  };

  public shared ({ caller }) func updateHomepageHeroContent(newContent : HomepageHeroContent) : async () {
    assertPermanentBoss(caller);
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
    assertPermanentBoss(caller);
    siteContentState := { siteContentState with footer = newFooterContent };
  };

  // Persistent public section API; non-restricted access
  public query ({ caller }) func getGravesDeclaration() : async PublicHtmlSection {
    siteContentState.gravesDeclaration;
  };

  public query ({ caller }) func getPrayerForTheDeceased() : async PrayerForTheDeceased {
    siteContentState.prayerForTheDeceased;
  };

  public query ({ caller }) func getCemeteryInformation() : async PublicHtmlSection {
    siteContentState.cemeteryInformation;
  };

  // Boss-only persistent section update methods (called through the management panel).
  public shared ({ caller }) func updateGravesDeclaration(newSection : PublicHtmlSection) : async () {
    assertPermanentBoss(caller);
    siteContentState := { siteContentState with gravesDeclaration = newSection };
  };

  public shared ({ caller }) func updatePrayerForTheDeceased(newSection : PrayerForTheDeceased) : async () {
    assertPermanentBoss(caller);
    siteContentState := { siteContentState with prayerForTheDeceased = newSection };
  };

  public shared ({ caller }) func updateCemeteryInformation(newSection : PublicHtmlSection) : async () {
    assertPermanentBoss(caller);
    siteContentState := { siteContentState with cemeteryInformation = newSection };
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

  // User profile functions - allow any authenticated user (not just Boss)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
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
    if (not isPermanentBoss(caller)) {
      return #err(#unauthorized);
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
    if (not isPermanentBoss(caller)) {
      return #err(#unauthorized);
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
    if (not isPermanentBoss(caller)) {
      return #err(#unauthorized);
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
    if (not isPermanentBoss(caller)) {
      return #err(#unauthorized);
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
    if (not isPermanentBoss(caller)) {
      return #err(#unauthorized);
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
    assertPermanentBoss(caller);

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
    assertPermanentBoss(caller);
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
    assertPermanentBoss(caller);
    graveRecords.values().toArray().sort();
  };

  public query ({ caller }) func getGravesByAlley(alley : Text) : async [GraveRecord] {
    assertPermanentBoss(caller);
    graveRecords.values().toArray().filter(
      func(grave : GraveRecord) : Bool { grave.alley == alley }
    ).sort();
  };

  public query ({ caller }) func getAvailableGraves() : async [GraveRecord] {
    assertPermanentBoss(caller);
    graveRecords.values().toArray().filter(
      func(grave : GraveRecord) : Bool { grave.status == #free }
    ).sort();
  };

  public query ({ caller }) func getPaginatedGraves(offset : Nat, pageSize : Nat) : async PaginatedGravesResult {
    assertPermanentBoss(caller);

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

  // Simplified public grave data.
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

  // PUBLIC method for searching public graves, including location.
  public query func searchPublicGravesWithLocation(
    surname : ?Text,
    yearOfDeath : ?Int,
  ) : async [PublicGraveResult] {
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
                [{
                  firstName = person.firstName;
                  lastName = person.lastName;
                  alley = grave.alley;
                  plotNumber = grave.plotNumber;
                  yearOfDeath = if (person.yearOfDeath > 0) { ?(person.yearOfDeath) } else { null };
                  status = grave.status;
                }].values();
              } else {
                [].values();
              };
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

  public query func healthCheck() : async () {
    ();
  };
};

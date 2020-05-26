DROP TABLE IF EXISTS Members CASCADE;
CREATE TABLE Members (MemberID SERIAL PRIMARY KEY,
                      FirstName VARCHAR(255) NOT NULL,
		              LastName VARCHAR(255) NOT NULL,
                      Username VARCHAR(255) NOT NULL UNIQUE,
                      Email VARCHAR(255) NOT NULL UNIQUE,
                      Password VARCHAR(255) NOT NULL,
                      SALT VARCHAR(255),
                      VerifyLink VARCHAR(255) NOT NULL,
                      Token VARCHAR(255),
                      Verification INT DEFAULT 0,
                      Privacy INT DEFAULT 0
);

-- Accounts for testing below
-- Verified account, Email: ksdod2@uw.edu Password: test123
INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerifyLink, Verification) VALUES ('Kameron', 'Dodd', 'ksdod2', 'ksdod2@uw.edu', '1f40476f11c7c6e0d70b4d8b3ed250dddddbb1f83e6e2930bd24bd1c55c7d258', '9d57d7fdf8e18a7a1d93151f95072a8b19f989a28187b872e6d3d3a1fcff5008', 'fedcba987654321abcde', 1);
-- Unverified account, Email: test@fake.com Password: asdf1234
INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerifyLink, Verification) VALUES ('Dummy', 'Data', 'ExampleGuy', 'test@fake.com', '594f1fba4cedafe95613594b3313947d86870cae39d9ca6c2fc14606ac3627b1', '25f8e1be59d763daec64caef7e685572741cc01cae18f8321f78fb251c383a55', 'ffffffffffffffffffff', 1);
-- Unverified account, Email: fake@fake.com Password: asdf1234
INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerifyLink, Verification) VALUES ('Notareal', 'Account', 'ExampleGal', 'fake@fake.com', '594f1fba4cedafe95613594b3313947d86870cae39d9ca6c2fc14606ac3627b1', '25f8e1be59d763daec64caef7e685572741cc01cae18f8321f78fb251c383a55', 'ffffffffffffffffffff', 1);
-- Alex's Account: abledso3@uw.edu
INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerifyLink, Verification) VALUES ('Alex', 'Bledsoe', 'Alex-Test', 'abledso3@uw.edu', 'fb4b4c222ceb16e3ac304f6dd732abc2007226910258b1f31d4881688255dc90', 'e9e28e2c451a559521696e40d462e0b45bda8f6f2df3ecaf41e016424ae3802f', 'acdfb9496f20ee92eb19728c8898ac50ce3d0657', 1);
-- Lenard's Account: lenard.smith@yahoo.com
INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerifyLink, Verification) VALUES ('Lenard', 'Smith', 'lenlen', 'lenard.smith@yahoo.com', '68fbbb7beeae214a763547316175877f489e274f4f9223a6a80949fb81e30a62', '48c682c6ac414a8c7e5bd05775826f38119e5613f9667a652a03c86bd4c7c3bd', '4eaf2fc353f390246195622adb2cac6744839066', 1);
-- John's Account: nguyenjohntran@gmail.com
INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerifyLink, Verification) VALUES ('John', 'Nguyen', 'ogj0hn', 'nguyenjohntran@gmail.com', '5928f09af2b66266d7f38c2cbadbb5dcf339fa18f4f94acfb52af86b10f8a376', '9dfe195c1c3178a35e82ff5606d38bb893222dde806af72725777e97b4bc8225', 'e6730510509dae9a971d7bdc8c6579d228191b1d', 1);
-- Charles' Account: cfb3@uw.edu
INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerifyLink, Verification) VALUES ('Charles', 'Bryan', 'cfb3', 'cfb3@uw.edu', 'a6a692fe39eb7616b4dc05589cbd35d0186f9396da146ec535febcdef3bf7a1d', '76476e261a46ab83ed27c082eab0f9e650847e3532aa0bfe8a152dcef574ce38', '414faa71f7309138736a91832db8a5456bd72187', 1);

DROP TABLE IF EXISTS Contacts CASCADE;
CREATE TABLE Contacts(PrimaryKey SERIAL PRIMARY KEY,
                      MemberID_A INT NOT NULL,
                      MemberID_B INT NOT NULL,
                      Verified INT DEFAULT 0,
                      FOREIGN KEY(MemberID_A) REFERENCES Members(MemberID),
                      FOREIGN KEY(MemberID_B) REFERENCES Members(MemberID)
);

DROP TABLE IF EXISTS Chats CASCADE;
CREATE TABLE Chats (ChatID SERIAL PRIMARY KEY,
                    Name VARCHAR(255) NOT NULL UNIQUE,
                    Description VARCHAR(255)
);

DROP TABLE IF EXISTS ChatMembers CASCADE;
CREATE TABLE ChatMembers (ChatID INT NOT NULL,
                          MemberID INT NOT NULL,
                          FOREIGN KEY(MemberID) REFERENCES Members(MemberID),
                          FOREIGN KEY(ChatID) REFERENCES Chats(ChatID)
);

DROP TABLE IF EXISTS Messages CASCADE;
CREATE TABLE Messages (PrimaryKey SERIAL PRIMARY KEY,
                       ChatID INT,
                       Message VARCHAR(255),
                       MemberID INT,
                       FOREIGN KEY(MemberID) REFERENCES Members(MemberID),
                       FOREIGN KEY(ChatID) REFERENCES Chats(ChatID),
                       TimeStamp TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

DROP TABLE IF EXISTS Locations CASCADE;
CREATE TABLE Locations (PrimaryKey SERIAL PRIMARY KEY,
                        MemberID INT,
                        Nickname VARCHAR(255),
                        Lat DECIMAL,
                        Long DECIMAL,
                        ZIP INT,
                        FOREIGN KEY(MemberID) REFERENCES Members(MemberID)
);
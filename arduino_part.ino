/*
  Sketch: Fingerprint access controller (robuste)
  - Protocole série (9600 bps) :
      -> 'V'            : passer en mode VERIFICATION
      -> 'E'            : passer en mode ENREGISTREMENT
      -> 'I:<id>' or 'I<number>' : définir l'ID d'enregistrement (0-127)
      -> 'C'            : annuler l'enregistrement en cours (si applicable)
  - Messages envoyés au PC (toutes les lignes finissent par '\n'):
      - ACK:... / ERR:... pour accusés
      - VERIFICATION: EN_COURS / SUCCES / ECHEC
      - ENREGISTREMENT: EN_COURS / SUCCES / ECHEC
      - PORTE: OUVERTE / PORTE: FERMEE
      - CAPTEUR: OK / CAPTEUR: ERREUR
      - INFO: ... pour messages divers
*/

#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>
#include <Servo.h>

// ======= Configuration des broches =======
#define RX_PIN 2      // SoftwareSerial RX (vers TX du module empreinte)
#define TX_PIN 3      // SoftwareSerial TX (vers RX du module empreinte)
#define SERVO_PIN 9   // Servo pour la porte
#define LED_VERTE_PIN 6
#define LED_ROUGE_PIN 7

// ======= Paramètres =======
#define SERIAL_BAUD 9600
#define FINGER_BAUD 57600
#define MAX_ENROLL_ID 127
#define MIN_ENROLL_ID 0
#define VERIFY_POLL_DELAY 200   // ms entre tentatives de verification
#define DOOR_OPEN_MS 10000      // durée ouverture porte (ms)

// ======= Instances =======
SoftwareSerial fingerSerial(RX_PIN, TX_PIN);
Adafruit_Fingerprint finger(&fingerSerial);
Servo porteServo;

// ======= Etats =======
enum Mode { MODE_VERIFY = 0, MODE_ENROLL = 1 };
Mode currentMode = MODE_VERIFY;
volatile int enrollId = 1;          // ID d'enregistrement courant
volatile bool enrollCancelled = false;

// ======= Buffer de réception série =======
String serialBuffer = "";

// ======= Fonctions utilitaires =======
void sendLine(const char *s) {
  Serial.print(s);
  Serial.print("\n");
}
void sendLine(const String &s) {
  Serial.print(s);
  Serial.print("\n");
}

// Envoi ACK/ERR
void sendAck(const String &what) {
  sendLine("ACK:" + what);
}
void sendErr(const String &what) {
  sendLine("ERR:" + what);
}

// ======= Prototypes =======
int getFingerprintIDBlocking(int timeout_ms = 3000);
int enrollFingerprint(uint8_t id);
void openDoor();
void closeDoor();
void setModeVerify();
void setModeEnroll();
void handleSerialCommand(const String &cmd);
void processSerialBuffer();
void cancelEnrollIfRequested();

// ======= Setup =======
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(50);
  fingerSerial.begin(FINGER_BAUD);
  porteServo.attach(SERVO_PIN);
  porteServo.write(0); // porte fermée initialement

  pinMode(LED_VERTE_PIN, OUTPUT);
  pinMode(LED_ROUGE_PIN, OUTPUT);
  digitalWrite(LED_VERTE_PIN, LOW);
  digitalWrite(LED_ROUGE_PIN, LOW);

  delay(100);

  // Initialisation capteur
  if (finger.verifyPassword()) {
    sendLine("CAPTEUR: OK");
  } else {
    sendLine("CAPTEUR: ERREUR");
    // On arrête si capteur non répondant
    while (1) {
      delay(1000);
    }
  }

  // Etat initial
  setModeVerify();
  sendLine("Mode: Verification");
}

// ======= Loop principal =======
unsigned long lastVerifyAttempt = 0;
void loop() {
  // Lire serial (PC -> Arduino)
  processSerialBuffer();

  if (currentMode == MODE_VERIFY) {
    unsigned long now = millis();
    if (now - lastVerifyAttempt >= VERIFY_POLL_DELAY) {
      lastVerifyAttempt = now;
      int res = getFingerprintIDBlocking(800); // court timeout
      if (res > 0) {
        // res contient id trouvé
        // message vers PC
        sendLine(String("VERIFICATION: SUCCES ID trouve: ") + res);
        digitalWrite(LED_VERTE_PIN, HIGH);
        digitalWrite(LED_ROUGE_PIN, LOW);
        openDoor();
        delay(DOOR_OPEN_MS);
        closeDoor();
        digitalWrite(LED_VERTE_PIN, LOW);
      } else if (res == -1) {
        // Empreinte lue mais non reconnue
        sendLine("VERIFICATION: ECHEC");
        digitalWrite(LED_VERTE_PIN, LOW);
        digitalWrite(LED_ROUGE_PIN, HIGH);
        delay(1500);
        digitalWrite(LED_ROUGE_PIN, LOW);
      }
      // res == 0 => pas de doigt (rien)
    }
  } else if (currentMode == MODE_ENROLL) {
    // On déclenche l'enregistrement dès qu'on est en mode E
    sendLine("ENREGISTREMENT: EN_COURS");
    int r = enrollFingerprint((uint8_t)enrollId);
    if (r == 1) {
      sendLine("ENREGISTREMENT: SUCCES");
    } else if (r == -1) {
      sendLine("ENREGISTREMENT: ECHEC");
    } else if (r == 2) {
      sendLine("ENREGISTREMENT: ABANDONNE"); // cancel
    }
    // Retour au mode verification automatiquement
    setModeVerify();
  }
}

// ======= Lecture et parsage des commandes série =======
void processSerialBuffer() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      String cmd = serialBuffer;
      serialBuffer = "";
      cmd.trim();
      if (cmd.length() > 0) {
        handleSerialCommand(cmd);
      }
    } else {
      serialBuffer += c;
      // limiter la taille du buffer
      if (serialBuffer.length() > 200) serialBuffer = serialBuffer.substring(serialBuffer.length() - 200);
    }
  }
}

// Commandes acceptées : V, E, I:12 or I12, C
void handleSerialCommand(const String &cmd) {
  // On traite le premier token
  if (cmd.length() == 0) return;

  // Convertir en majuscules pour tolérer casse
  String c = cmd;
  c.toUpperCase();

  // Modes simples
  if (c == "V") {
    setModeVerify();
    sendAck("MODE:V");
    sendLine("Mode: Verification");
    return;
  } else if (c == "E") {
    setModeEnroll();
    sendAck("MODE:E");
    return;
  } else if (c == "C") {
    enrollCancelled = true;
    sendAck("CANCEL");
    return;
  }

  // ID set : accepter "I:12" "I12" "I=12"
  if (c.startsWith("I")) {
    // extraire chiffres
    String digits = "";
    for (unsigned int i = 1; i < c.length(); i++) {
      char ch = c.charAt(i);
      if (isDigit(ch)) digits += ch;
    }
    if (digits.length() == 0) {
      sendErr("ID missing");
      return;
    }
    int idVal = digits.toInt();
    if (idVal < MIN_ENROLL_ID || idVal > MAX_ENROLL_ID) {
      sendErr("ID out of range (0-127)");
      return;
    }
    enrollId = idVal;
    sendAck(String("ID:") + enrollId);
    sendLine(String("ID ENREGISTREMENT: ") + enrollId);
    return;
  }

  // Sinon commande non reconnue
  sendErr("Unknown command: " + cmd);
}

// ======= Mode management =======
void setModeVerify() {
  currentMode = MODE_VERIFY;
  enrollCancelled = false;
}

void setModeEnroll() {
  currentMode = MODE_ENROLL;
  enrollCancelled = false;
}

// ======= Servo / porte =======
void openDoor() {
  porteServo.write(90); // ajuster selon mécanique
  sendLine("PORTE: OUVERTE");
}

void closeDoor() {
  porteServo.write(0);
  sendLine("PORTE: FERMEE");
}

// ======= Fingerprint helper functions =======

// Retourne:
//   >0 : ID trouvé
//    0 : rien (pas de doigt ou timeout sans lecture)
//   -1 : empreinte lue mais NON reconnue (search failed)
int getFingerprintIDBlocking(int timeout_ms) {
  unsigned long start = millis();
  while (millis() - start < timeout_ms) {
    uint8_t p = finger.getImage();
    if (p == FINGERPRINT_OK) {
      // convert image
      p = finger.image2Tz();
      if (p != FINGERPRINT_OK) return 0; // problème conversion
      // recherche rapide
      p = finger.fingerFastSearch();
      if (p == FINGERPRINT_OK) {
        // found
        int found = finger.fingerID;
        return found;
      } else {
        // empreinte lue mais pas trouvée
        return -1;
      }
    } else if (p == FINGERPRINT_NOFINGER) {
      // pas encore de doigt
      // continuer
    } else {
      // d'autres codes : continue
    }
    delay(50);
  }
  return 0; // timeout, rien
}

// Enregistrement d'une empreinte dans l'ID donné
// Retour:
//   1 = success
//  -1 = fail
//   2 = cancelled by user
int enrollFingerprint(uint8_t id) {
  if (id < MIN_ENROLL_ID || id > MAX_ENROLL_ID) {
    sendErr("Invalid enroll id");
    return -1;
  }

  // Phase 1: prendre la première image
  sendLine("INFO: Placez le doigt pour image 1...");
  unsigned long startT = millis();
  while (true) {
    if (enrollCancelled) return 2;
    uint8_t p = finger.getImage();
    if (p == FINGERPRINT_OK) {
      sendLine("INFO: Image 1 acquise");
      break;
    } else if (p == FINGERPRINT_NOFINGER) {
      // attente
    } else {
      // pas encore prêt
    }
    if (millis() - startT > 20000) { // timeout 20s
      sendErr("Timeout image1");
      return -1;
    }
    delay(100);
  }
  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    sendErr("image2Tz(1) fail");
    return -1;
  }

  // Demander de retirer le doigt
  sendLine("INFO: Retirez le doigt...");
  delay(2000);
  startT = millis();
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    if (enrollCancelled) return 2;
    if (millis() - startT > 10000) {
      sendErr("Timeout retirer doigt");
      return -1;
    }
    delay(100);
  }

  // Phase 2: replacer même doigt
  sendLine("INFO: Replacez le même doigt pour image 2...");
  startT = millis();
  while (true) {
    if (enrollCancelled) return 2;
    uint8_t p = finger.getImage();
    if (p == FINGERPRINT_OK) {
      sendLine("INFO: Image 2 acquise");
      break;
    } else if (p == FINGERPRINT_NOFINGER) {
      // attente
    }
    if (millis() - startT > 20000) {
      sendErr("Timeout image2");
      return -1;
    }
    delay(100);
  }
  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    sendErr("image2Tz(2) fail");
    return -1;
  }

  // Création du modèle
  if (finger.createModel() != FINGERPRINT_OK) {
    sendErr("createModel fail");
    return -1;
  }

  // Stocker modèle
  if (finger.storeModel(id) == FINGERPRINT_OK) {
    sendLine(String("INFO: Model stored at ID ") + id);
    return 1;
  } else {
    sendErr("storeModel fail");
    return -1;
  }
}

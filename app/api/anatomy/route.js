import { NextResponse } from "next/server";

// Comprehensive anatomy database for all bones in the hand and arm
const BONE_ANATOMY = {
  // ===== CARPAL BONES (Wrist) =====
  "Scaphoid": "The scaphoid is a boat-shaped carpal bone located on the thumb side of the wrist. It articulates with the radius proximally and the trapezium and trapezoid distally. The scaphoid acts as a mechanical link between the proximal and distal carpal rows, crucial for wrist stability and range of motion. It has a unique blood supply that enters distally, making the proximal pole vulnerable to avascular necrosis. Scaphoid fractures are the most common carpal bone fracture, typically from falling on an outstretched hand (FOOSH injury), and can lead to non-union if untreated.",

  "Lunate": "The lunate is a crescent or moon-shaped carpal bone located in the center of the proximal carpal row. It articulates with the radius proximally, the capitate and hamate distally, and the scaphoid and triquetrum laterally. The lunate is critical for transmitting forces from the hand to the forearm during gripping and weight-bearing. Its vulnerable blood supply can lead to Kienböck's disease (avascular necrosis of the lunate), causing wrist pain, stiffness, and arthritis. Lunate dislocations are serious injuries that require immediate reduction to prevent median nerve compression.",

  "Triquetrum": "The triquetrum is a pyramidal-shaped carpal bone on the ulnar (pinky) side of the proximal carpal row. It articulates with the lunate medially, the hamate distally, and has a small articulation with the pisiform on its palmar surface. The triquetrum acts as a stabilizer for the ulnar side of the wrist during rotational movements. It is the second most commonly fractured carpal bone, usually from direct impact or extreme wrist dorsiflexion. Triquetral fractures often present with ulnar-sided wrist pain and can be associated with ligamentous injuries.",

  "Pisiform": "The pisiform is a small, pea-shaped sesamoid bone embedded within the flexor carpi ulnaris tendon on the palmar side of the wrist. It articulates only with the triquetrum and sits in the proximal carpal row on the ulnar side. The pisiform serves as a mechanical lever, increasing the moment arm of the flexor carpi ulnaris muscle for wrist flexion and ulnar deviation. It can be fractured by direct trauma or repetitive stress. Pisiform fractures are rare but can cause tenderness at the hypothenar eminence and pain with wrist flexion.",

  "Trapezium": "The trapezium is an irregularly shaped carpal bone at the base of the thumb in the distal carpal row. It articulates with the scaphoid proximally, the first metacarpal (thumb) distally, and the trapezoid and second metacarpal medially. The trapezium features a saddle-shaped joint with the thumb metacarpal, allowing the thumb's wide range of motion including opposition. The trapezium is commonly affected by osteoarthritis (basilar thumb arthritis), causing pain, weakness, and grinding sensation at the thumb base. This degenerative condition can significantly impair hand function and grip strength.",

  "Trapezoid": "The trapezoid is a small, wedge-shaped carpal bone in the distal row between the trapezium and capitate. It articulates with the scaphoid proximally, the second metacarpal (index finger) distally, and the trapezium and capitate on either side. The trapezoid provides a stable base for the index finger's metacarpal, crucial for pinch grip and fine motor control. It is the least commonly injured carpal bone due to its protected position. Isolated trapezoid fractures are rare and usually result from high-energy trauma or crushing injuries.",

  "Capitate": "The capitate is the largest carpal bone, located centrally in the distal carpal row. It articulates with the scaphoid and lunate proximally, the third metacarpal (middle finger) distally, and the trapezoid and hamate on either side. The capitate serves as the keystone of the carpus, transmitting the majority of axial loads from the hand to the forearm. Its central position makes it vulnerable to fractures during falls or direct impact. Capitate fractures can occur in isolation or as part of scapholunate dissociation injuries, potentially leading to carpal instability.",

  "Hamate": "The hamate is a wedge-shaped carpal bone on the ulnar side of the distal row, featuring a distinctive hook-like process (hook of hamate) on its palmar surface. It articulates with the lunate and triquetrum proximally, and the fourth and fifth metacarpals (ring and pinky fingers) distally. The hook of hamate serves as an attachment point for ligaments and the transverse carpal ligament, forming the ulnar border of the carpal tunnel. Fractures of the hook of hamate are common in racquet sports and golf, causing ulnar-sided hand pain and can lead to ulnar nerve or flexor tendon complications.",

  // ===== METACARPALS (Palm) =====
  "1st Metacarpal (Thumb)": "The first metacarpal is the shortest and thickest of the metacarpal bones, forming the skeletal structure of the thumb. It articulates with the trapezium at its base via a unique saddle joint that allows thumb opposition and circumduction. Unlike other metacarpals, it is highly mobile and positioned at 90 degrees to the palm. The first metacarpal transmits forces during pinch and grip activities and is essential for hand dexterity. Fractures (especially Bennett's and Rolando fractures at the base) are common from axial loading or direct trauma and require careful management to preserve thumb function.",

  "1st Metacarpal (Thumb) - duplicate bone": "The first metacarpal is the shortest and thickest of the metacarpal bones, forming the skeletal structure of the thumb. It articulates with the trapezium at its base via a unique saddle joint that allows thumb opposition and circumduction. Unlike other metacarpals, it is highly mobile and positioned at 90 degrees to the palm. The first metacarpal transmits forces during pinch and grip activities and is essential for hand dexterity. Fractures (especially Bennett's and Rolando fractures at the base) are common from axial loading or direct trauma and require careful management to preserve thumb function.",

  "2nd Metacarpal (Index)": "The second metacarpal forms the skeletal base of the index finger and is the longest of the metacarpal bones. It articulates with the trapezoid and capitate at its base, forming a relatively immobile carpometacarpal joint for stability during pinch activities. The second metacarpal is crucial for precision grip and pointing movements. Its shaft is the most commonly fractured metacarpal, typically from direct punching trauma (boxer's fracture misnomer - actually fifth metacarpal). These fractures usually heal well with conservative treatment due to good blood supply.",

  "3rd Metacarpal (Middle)": "The third metacarpal supports the middle finger and has a distinctive styloid process at its base. It articulates primarily with the capitate, creating a very stable and immobile carpometacarpal joint that serves as the central pillar of the hand. This metacarpal transmits the greatest axial loads during gripping activities. Due to its central position and strong ligamentous support, isolated third metacarpal fractures are less common. When they occur, they typically result from high-energy trauma or crushing injuries.",

  "4th Metacarpal (Ring)": "The fourth metacarpal forms the skeletal structure of the ring finger and articulates with the hamate and capitate at its base. It has limited mobility at the carpometacarpal joint, providing stability while allowing slight flexion to accommodate power grip. The fourth metacarpal contributes to the transverse arch of the hand, important for grasping cylindrical objects. Fractures are less common than the fifth metacarpal but can occur from direct trauma. Proper alignment is crucial as rotational deformities can significantly impair hand function.",

  "5th Metacarpal (Pinky)": "The fifth metacarpal is the shortest and most mobile metacarpal after the thumb, forming the base of the pinky finger. It articulates with the hamate, creating a mobile carpometacarpal joint that allows opposition to the thumb and cupping of the hand. The fifth metacarpal is most commonly fractured (true boxer's fracture) from punching with a closed fist. Neck fractures with volar angulation are the typical pattern. Some angulation is acceptable due to the joint's mobility, but rotational deformities must be corrected.",

  // ===== THUMB PHALANGES =====
  "Thumb Proximal Phalanx": "The proximal phalanx of the thumb is a short, thick bone forming the first segment of the thumb between the metacarpal and the interphalangeal joint. It articulates with the first metacarpal head via a condyloid joint proximally and the distal phalanx distally. This bone provides the lever arm for thumb flexion and extension, crucial for pinch and grip strength. The proximal phalanx houses insertions of the flexor pollicis longus and extensor pollicis longus tendons. Fractures are relatively common from crushing injuries or hyperextension and may require surgical fixation to maintain thumb function.",

  "Thumb Distal Phalanx": "The distal phalanx of the thumb is the terminal bone of the thumb, forming the fingertip structure. It features a broad tuft at its tip that supports the nail bed and pulp, critical for tactile sensation and fine manipulation. This phalanx articulates with the proximal phalanx through the interphalangeal joint. The distal phalanx serves as the insertion point for the flexor pollicis longus tendon, enabling powerful thumb flexion for pinching. Fractures (often tuft fractures) commonly result from crushing injuries and can be associated with nail bed lacerations requiring meticulous repair.",

  // ===== INDEX FINGER PHALANGES =====
  "Index Proximal Phalanx": "The proximal phalanx of the index finger is the longest segment of the index finger, connecting the metacarpal to the middle phalanx. It articulates with the second metacarpal head via a condyloid joint and the middle phalanx distally. This bone provides the primary lever arm for finger flexion and houses the insertions of intrinsic muscles and flexor digitorum superficialis tendon. The index finger's proximal phalanx is critical for precision pinch and pointing activities. Fractures can result from direct trauma or crushing injuries and may cause rotational deformities affecting hand function.",

  "Index Middle Phalanx": "The middle phalanx of the index finger is the intermediate segment between the proximal and distal phalanges. It articulates at the proximal interphalangeal (PIP) joint with the proximal phalanx and at the distal interphalangeal (DIP) joint with the distal phalanx. This bone serves as the insertion for the flexor digitorum superficialis and provides the lever for PIP joint flexion. The middle phalanx contributes significantly to grip strength and fine motor control. Fractures or dislocations at the PIP joint are common athletic injuries that can lead to chronic stiffness and swan-neck or boutonniere deformities.",

  "Index Distal Phalanx": "The distal phalanx of the index finger forms the fingertip, featuring an expanded tuft that supports the fingernail and pulp. It articulates with the middle phalanx through the DIP joint. This phalanx is the insertion site for the flexor digitorum profundus tendon, enabling independent tip flexion crucial for picking up small objects. The distal phalanx has rich sensory innervation, making the fingertip highly sensitive. Tuft fractures from crushing injuries are common, while mallet finger (extensor tendon avulsion) can cause permanent DIP joint droop if untreated.",

  // ===== MIDDLE FINGER PHALANGES =====
  "Middle Proximal Phalanx": "The proximal phalanx of the middle finger is typically the longest phalanx in the hand, forming the base of the longest finger. It articulates with the third metacarpal proximally and the middle phalanx distally through the PIP joint. This bone bears significant force during power grip activities due to the middle finger's central position. It serves as an attachment for intrinsic hand muscles and the flexor digitorum superficialis. Fractures are common from ball sports or direct trauma and can significantly impair grip strength if misaligned or if stiffness develops.",

  "Middle Middle Phalanx": "The middle phalanx of the middle finger connects the proximal and distal segments of the longest finger. It participates in both PIP and DIP joints, crucial for full finger flexion during grasping. This phalanx provides the insertion for the flexor digitorum superficialis tendon centrally. The middle finger's length makes it particularly vulnerable to jamming injuries in sports. PIP joint injuries involving this bone can result in significant functional impairment, including chronic pain, stiffness, and decreased grip strength, especially if complicated by fracture-dislocation.",

  "Middle Distal Phalanx": "The distal phalanx of the middle finger forms the fingertip of the longest finger, with a prominent tuft supporting the nail and fingertip pulp. It articulates with the middle phalanx via the DIP joint. As the insertion point for the flexor digitorum profundus, it enables independent tip flexion of the middle finger. The middle finger's length and central position make it frequently involved in work-related crushing injuries. Distal phalanx fractures, including tuft fractures and nail bed injuries, are common in industrial and household accidents.",

  // ===== RING FINGER PHALANGES =====
  "Ring Proximal Phalanx": "The proximal phalanx of the ring finger forms the base segment, articulating with the fourth metacarpal and the middle phalanx. It is slightly shorter than the middle finger's proximal phalanx but longer than the index finger's. This bone contributes significantly to power grip as the ring finger generates substantial gripping force. It houses muscle and tendon attachments for both flexion and extension. Fractures may occur from direct trauma or crushing injuries. The ring finger's connection to adjacent fingers through fascial bands means injuries here can affect overall hand function.",

  "Ring Middle Phalanx": "The middle phalanx of the ring finger bridges the proximal and distal segments, participating in both PIP and DIP articulations. It provides the insertion for the flexor digitorum superficialis tendon and contributes to the finger's overall flexion mechanics. This phalanx is involved in both precision and power grip activities. Ring avulsion injuries (degloving) can involve this bone when rings catch on objects during falls. PIP joint injuries at this level can cause chronic stiffness and weakness, significantly affecting activities requiring sustained grip.",

  "Ring Distal Phalanx": "The distal phalanx of the ring finger forms the fingertip with its characteristic tuft supporting the nail bed. It articulates with the middle phalanx at the DIP joint and serves as the insertion for the flexor digitorum profundus tendon. The ring finger's distal phalanx is frequently involved in ring avulsion injuries where the fingertip can be partially or completely degloved. These severe injuries may result in vascular compromise requiring microsurgical repair. Crush injuries to this phalanx are also common in door slam accidents, often with associated nail bed lacerations.",

  // ===== PINKY FINGER PHALANGES =====
  "Pinky Proximal Phalanx": "The proximal phalanx of the pinky finger is the shortest proximal phalanx, forming the base of the small finger. It articulates with the fifth metacarpal head and the middle phalanx. Despite its small size, it plays an important role in power grip, contributing up to 50% of grip strength along with the ring finger. The pinky's ulnar position makes it vulnerable to impact injuries. Fractures are common from direct trauma or falls. The abductor digiti minimi muscle attaches here, providing finger abduction important for grasping large objects.",

  "Pinky Middle Phalanx": "The middle phalanx of the pinky finger is the shortest middle phalanx, connecting the proximal and distal segments of the small finger. It articulates at the PIP and DIP joints and provides insertion for the flexor digitorum superficialis. Though small, this bone is crucial for the pinky's contribution to grip strength and hand span. The pinky's lateral position makes it susceptible to jamming injuries and dislocations, particularly in ball sports. Chronic PIP joint stiffness from injuries here can noticeably reduce overall grip strength and hand function.",

  "Pinky Distal Phalanx": "The distal phalanx of the pinky finger is the smallest distal phalanx, forming the small fingertip with its nail and pulp. It articulates with the middle phalanx via the DIP joint and serves as insertion for the flexor digitorum profundus tendon. The pinky's distal phalanx provides tactile feedback important for fine motor tasks and typing. Its lateral position makes it vulnerable to crush injuries, particularly in doors or machinery. Mallet finger deformity can occur from extensor tendon injuries, causing permanent DIP droop that affects keyboard use and other activities requiring extended fingers.",

  // ===== FOREARM BONES =====
  "Radius (Forearm - Thumb Side)": "The radius is the lateral forearm bone on the thumb side, extending from the elbow to the wrist. It articulates with the capitellum of the humerus proximally, the ulna medially along its length, and the scaphoid and lunate distally. The radius is the primary weight-bearing bone of the forearm, transmitting about 80% of axial loads from the hand to the upper arm. Its distal end features the broad radial styloid process and articular surfaces for the wrist. Distal radius fractures (Colles' and Smith's fractures) are among the most common fractures in adults, typically from falls on an outstretched hand, and can affect wrist function if poorly aligned.",

  "Ulna (Forearm - Pinky Side)": "The ulna is the medial forearm bone on the pinky side, running parallel to the radius from elbow to wrist. It articulates with the trochlea of the humerus at the elbow via its prominent olecranon process (forming the elbow point), and distally with the radius and triangular fibrocartilage complex at the wrist. The ulna provides rotational stability to the forearm and serves as the primary stabilizer at the elbow joint. The proximal ulna's subcutaneous position makes it vulnerable to direct trauma. Ulnar shaft fractures often occur with radial head dislocations (Monteggia fractures) or radius shaft fractures (both-bone forearm fractures).",

  // ===== UPPER ARM BONES =====
  "Right Humerus (Upper Arm)": "The humerus is the long bone of the upper arm, extending from the shoulder to the elbow. It articulates with the scapula at the glenohumeral joint proximally (forming the shoulder) and with the radius and ulna at the elbow distally. The humerus provides the lever arm for powerful shoulder and elbow movements including flexion, extension, abduction, and rotation. Its shaft contains the radial groove where the radial nerve passes, making nerve injury a concern with fractures. Humeral fractures can occur at the surgical neck (common in elderly), shaft (often from direct trauma), or supracondylar region (common in children), each with specific complications and treatment considerations.",

  "Left Humerus (Upper Arm)": "The humerus is the long bone of the upper arm, extending from the shoulder to the elbow. It articulates with the scapula at the glenohumeral joint proximally (forming the shoulder) and with the radius and ulna at the elbow distally. The humerus provides the lever arm for powerful shoulder and elbow movements including flexion, extension, abduction, and rotation. Its shaft contains the radial groove where the radial nerve passes, making nerve injury a concern with fractures. Humeral fractures can occur at the surgical neck (common in elderly), shaft (often from direct trauma), or supracondylar region (common in children), each with specific complications and treatment considerations."
};

export async function POST(req) {
  try {
    const { structure } = await req.json();

    if (!structure) {
      return NextResponse.json(
        { error: "Structure name is required" },
        { status: 400 }
      );
    }

    console.log("Received structure request for:", structure);

    // Simulate AI processing time (2-4 seconds)
    const delay = Math.floor(Math.random() * 2000) + 2000; // Random delay between 2000-4000ms
    await new Promise(resolve => setTimeout(resolve, delay));

    // Look up the bone description
    const description = BONE_ANATOMY[structure];

    if (description) {
      console.log("Found static description for:", structure);
      return NextResponse.json({ description, boneName: structure });
    }

    // If bone not found, return a helpful message
    console.log("No description found for:", structure);
    return NextResponse.json({
      description: `Detailed anatomical information for "${structure}" is not available in the current database. This bone may require additional research or may be referenced by a different anatomical name.`,
      boneName: structure
    });

  } catch (error) {
    console.error("Error in anatomy API:", error);
    return NextResponse.json(
      { error: "Failed to fetch anatomy information", details: error.message },
      { status: 500 }
    );
  }
}

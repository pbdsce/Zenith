import { db } from "../Firebase";
import { collection, getDocs, doc, updateDoc, getDoc, query, where } from "firebase/firestore";

/**
 * This script migrates the isAdmin field from user_batches to user_profiles
 * It should be run once to update all existing users
 */
async function migrateAdminStatus() {
  console.log("🚀 Starting admin status migration...");
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Get all user_profiles
    const usersRef = collection(db, "user_profiles");
    const userSnapshot = await getDocs(usersRef);
    
    console.log(`Found ${userSnapshot.size} user profiles to process`);

    for (const userDoc of userSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const batchDocId = userData.batch_doc_id;
      
      try {
        // Skip if user already has isAdmin field
        if (userData.isAdmin !== undefined) {
          console.log(`Skipping user ${userId}: isAdmin already defined as ${userData.isAdmin}`);
          skipped++;
          continue;
        }

        // Get the batch document to check admin status
        const batchRef = doc(db, "user_batches", batchDocId);
        const batchSnap = await getDoc(batchRef);
        
        if (!batchSnap.exists()) {
          console.warn(`Batch not found for user ${userId}, setting isAdmin=false`);
          await updateDoc(doc(db, "user_profiles", userId), {
            isAdmin: false
          });
          updated++;
          continue;
        }
        
        // Find user in batch
        const batchData = batchSnap.data();
        const userInBatch = batchData.users.find((u: any) => u.uid === userId);
        
        if (!userInBatch) {
          console.warn(`User ${userId} not found in batch ${batchDocId}, setting isAdmin=false`);
          await updateDoc(doc(db, "user_profiles", userId), {
            isAdmin: false
          });
          updated++;
          continue;
        }
        
        // Update isAdmin in user_profiles
        const isAdmin = userInBatch.isAdmin === true;
        console.log(`Setting isAdmin=${isAdmin} for user ${userId}`);
        
        await updateDoc(doc(db, "user_profiles", userId), {
          isAdmin: isAdmin
        });
        
        updated++;
      } catch (error) {
        console.error(`Failed to process user ${userId}:`, error);
        failed++;
      }
    }

    console.log("✅ Migration completed!");
    console.log(`Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

// Run the migration
migrateAdminStatus().catch(console.error);
```

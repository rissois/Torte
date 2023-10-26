
const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();

// Replace BUCKET_NAME
const bucket = 'gs://torte-backups';

/**
 * Every day at 4:30AM, back up all Torte files into the torte-backups storage bucket (Google Cloud Console)
 */
exports.dailyBackup = functions.pubsub.schedule('30 4 * * *').timeZone('America/New_York').onRun((context) => {
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const databaseName =
        client.databasePath(projectId, '(default)');

    return client.exportDocuments({
        name: databaseName,
        outputUriPrefix: bucket,
        // Leave collectionIds empty to export all collections
        // or set to a list of collection IDs to export,
        // collectionIds: ['users', 'posts']
        collectionIds: ['Torte', 'Users', 'Receipts']
    })
        .then(responses => {
            const response = responses[0];
            console.log(`Operation Name: ${response['name']}`);
            return null
        })
        .catch(err => {
            console.error(err);
            throw new Error('Export operation failed');
        });
})
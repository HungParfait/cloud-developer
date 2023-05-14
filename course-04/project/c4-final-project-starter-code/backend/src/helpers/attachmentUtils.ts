import * as AWSXRay from 'aws-xray-sdk'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// TODO: Implement the fileStogare logic

export class AttachmentUtils {
    constructor(private readonly s3Client = AWSXRay.captureAWSv3Client(new S3Client({region: 'us-east-1'})),
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET) { }

    async getPreSignedURL(imageID: string): Promise<string> {
        const command = new PutObjectCommand({
            "Bucket": this.bucketName,
            "Key": `${imageID}.png`,
        });
        return await getSignedUrl(this.s3Client, command, { expiresIn: 360000 });
    }
}
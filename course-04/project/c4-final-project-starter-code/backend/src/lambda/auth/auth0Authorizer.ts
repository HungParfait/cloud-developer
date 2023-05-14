import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-o7y30lgdjxn6hllb.us.auth0.com/.well-known/jwks.json'

interface Key {
  alg: string,
  kty: string,
  use: string,
  x5c: string[],
  e: string,
  n: string,
  kid: string,
  x5t: string,
  nbf?: string
} 

type GetKeysResponse = {
  keys: Key[]
};

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  const response = await Axios.get<GetKeysResponse>(jwksUrl)

  const keys = response.data.keys;

  if (!keys || !keys.length) {
    throw new Error('The JWKS endpoint did not contain any keys');
  }

  const signingKeys = keys
    .filter(key => key.use === 'sig' 
                && key.kty === 'RSA' 
                && key.kid
                && ((key.x5c && key.x5c.length) || (key.n && key.e))
    ).map(key => {
      return { kid: key.kid, nbf: key.nbf, publicKey: key.x5c[0] };
    });

  if (!signingKeys.length) {
    throw new Error('The JWKS endpoint did not contain any signature verification keys');
  }

  const signingKey = signingKeys.find(key => key.kid === jwt.header.kid);

  if (!signingKey) {
    throw new Error(`Unable to find a signing key that matches '${jwt.header.kid}'`);
  }

  return verify(token, '-----BEGIN CERTIFICATE-----' + '\n' + signingKey.publicKey + '\n' + '-----END CERTIFICATE-----\n', { algorithms: ['RS256'] }) as JwtPayload

}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

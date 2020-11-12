/**
 *** Copyright 2020 ProximaX Limited. All rights reserved.
 *** Use of this source code is governed by the Apache 2.0
 *** license that can be found in the LICENSE file.
 **/

/**
 * BegginingOfChainShift defines maximum duration back in time for the certificate start time
 */
export const BegginingOfChainShift =  24;

/**
 * we are generating certificates for a month now for testing purposes
 */
export const certificateLifetime = 3600 * 24 * 30;//in seconds

/**
 * MaximumMessageSize defines maximum application level protocol message size
 */
export const MaximumMessageSize = 10485760; // 10Mb?

/**
 * Ed25519CertificateSelfSigned is for signed messages/certificates signed by self signed certificate
 */
export const Ed25519CertificateSelfSigned = 0xE0;

/**
 * Ed25519CertificateRegular is for signed messages/certificates signed by authority nodes
 */
export const Ed25519CertificateRegular  = 0xED;
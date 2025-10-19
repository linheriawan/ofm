#!/usr/bin/env bun

// Quick test to verify environment variables are loaded
console.log('Environment Variables Check:');
console.log('============================');
console.log('SCIM_CLIENT_ID:', process.env.SCIM_CLIENT_ID || '❌ NOT SET');
console.log('SCIM_CLIENT_SECRET:', process.env.SCIM_CLIENT_SECRET ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('SSO_BASE_URL:', process.env.SSO_BASE_URL || '❌ NOT SET');
console.log('============================');

const scimConfigured = !!process.env.SCIM_CLIENT_ID && !!process.env.SCIM_CLIENT_SECRET;
console.log('SCIM Configured:', scimConfigured ? '✅ YES' : '❌ NO');

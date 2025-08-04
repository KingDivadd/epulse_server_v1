import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
// import { Strategy as AppleStrategy } from 'passport-apple';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

passport.serializeUser((user: any, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});

    // Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.CALLBACK_URL}/google/callback`,
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Find or create user in your database
        const user = {
            id: profile.id,
            email: profile.emails?.[0].value,
            name: profile.displayName,
            provider: 'google',
        };
        // Generate JWT
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        
        done(null, { ...user, token });
    } catch (err) {
        done(err, null!);
    }
}
));

    // Facebook Strategy
passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    callbackURL: `${process.env.CALLBACK_URL}/facebook/callback`,
    profileFields: ['id', 'emails', 'name'],
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const user = {
            id: profile.id,
            email: profile.emails?.[0].value,
            name: `${profile.name?.givenName} ${profile.name?.familyName}`,
            providertrailers: 'facebook',
        };
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        done(null, { ...user, token });
    } catch (err) {
        done(err, null);
    }
}
));

// // Apple Strategy
// passport.use(new AppleStrategy({
//     clientID: process.env.APPLE_CLIENT_ID!,
//     teamID: process.env.APPLE_TEAM_ID!,
//     keyID: process.env.APPLE_KEY_ID!,
//     privateKey: process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
//     callbackURL: `${process.env.CALLBACK_URL}/apple/callback`,
//     },
//     async (accessToken, refreshToken, idToken, profile, done) => {
//         try {
//             const user = {
//                 id: idToken.sub,
//                 email: idToken.email,
//                 name: profile?.name || 'Apple User',
//                 provider: 'apple',
//             };
//             const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1h' });
//             done(null, { ...user, token });
//         } catch (err) {
//             done(err, null);
//         }
//     }
// ));

export default passport;
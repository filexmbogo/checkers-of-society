const passport = require('passport');
const { Strategy } = require('passport-local');
const User = require('../models/users');
let createdUser 
passport.use(
    new Strategy(
        { usernameField: 'email', passwordField: 'password', passReqToCallback: true },
        
        async (req, email, password, done) => {
            try {
                // Check if the user already exists by email
                let findUser = await User.findOne({ email });
                console.log(findUser);
                
                if (findUser!=null) {
                    console.log('User exists');
                    return done(null, findUser); // Pass user to done if exists
                }
                
               
                
                return done(null, null); // Pass new user to done
                
            } catch (err) {
                console.error('Error in strategy:', err);
                return done(err); // Pass error to done
            }
        }
    )
);
passport.serializeUser((user, done) => {
    done(null, user.id);})


    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id); // Find the user by ID
            done(null, user);  
        } catch (err) {
            done(err); 
        }
    });

module.exports = passport;

'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const cron = require('node-cron');
var routes = require('./routes/index');
var users = require('./routes/users');
const multer = require('multer');

        //load aws cognito route
var awsAuth = require('./routes/awsCognito');
        //load customers route
var userDetail = require('./routes/userDetail');
        //load Foreign exchange rates route
var exchangeRates = require('./routes/foreignExcRates');
        //load cassandra route
var cassandrainfo = require('./routes/cassandrainfo');
        //load fileWatcher
var fileWatch = require('./routes/fileWatcher');
        //load emailer
var emailer = require('./routes/SendEmail');
var common = require('./routes/common');
var diamondprocess = require('./routes/diamondProcess');
var jewelryprocess = require('./routes/JewelryProcess');
var cassandra = require('cassandra-driver');
//var fs = require('fs');
var fs = require('fs-extra');
const unzip = require('unzip');
const sharp = require('sharp');
        //load redis route
///var redisCon = require('./routes/connectRedis');
//var session = require('express-session');
//var redisStore = require('connect-redis')(session);
//load aws
//var awstablebuild = require('./routes/AwsTables');

//Rename XML header
//var renameXML = require('./routes/changeXMLHeader');
var app = express();
// -------- for image upload -----------
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart({
    uploadDir: 'C:/Hardeep/gemfind/NodeAPI/UploadedContent/'
});
const multipartMiddleware2 = multipart({
    uploadDir: 'C:/Hardeep/gemfind/NodeAPI/uploads/root/'
});
const multipartMiddleware3 = multipart({
    uploadDir: 'C:/Hardeep/gemfind/NodeAPI/uploads/root/'
});
app.use('/uploads', express.static('uploads'));  /// to bind upload file path
app.use('/FinalOutputFiles', express.static('FinalOutputFiles'));
app.use('/UploadedContent', express.static('UploadedContent'));
// ---------------- end ---------------


var cors = require('cors');
app.use(bodyParser.urlencoded({ extended: true }));
var contactPoints = ['127.0.0.1'];
var client = new cassandra.Client({ contactPoints: contactPoints, localDataCenter: 'datacenter1' });
client.connect(function (err, result) {
    console.log('users: cassandra connected');
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/usersAccess', users);
app.get('/cassandrainfo', cassandrainfo.init_cassandra);

app.get('/users', userDetail.list);
//app.get('/customers/add', customers.add);
app.post('/users/add', userDetail.save);
app.get('/users/country', userDetail.country);
app.get('/users/delete/:id', userDetail.delete_customer);
app.get('/users/edit/:email', userDetail.edit);
app.post('/users/edit', userDetail.save_edit);
app.post('/users/changePass', userDetail.update_password);
//---------------------new
app.get('/users/getuserbyEmail', userDetail.userbyemail);
app.get('/users/getcompanybyEmail', userDetail.companyDetailByEmail);
app.get('/users/getcompanyall', userDetail.getcompanyall);
app.post('/users/updateuserpassword', userDetail.updateuserpassword);
app.get('/users/getusersall', userDetail.getusersall);
app.get('/users/userdisable', userDetail.userdisable);
app.get('/users/userenable', userDetail.userenable);
app.get('/users/companyedit', userDetail.companyedit);
app.post('/users/companyDetailupdate', userDetail.companyDetailupdate);
app.post('/users/addnewcompany', userDetail.addnewcompany);
app.get('/users/compaydisable', userDetail.compaydisable);
app.get('/users/compayenable', userDetail.compayenable);
app.get('/users/getcompanysonly', userDetail.getcompanysonly);

app.post('/users/ftpUpload', userDetail.ftpUpload);
app.get('/users/getftpdatabyid', userDetail.getuploadeddatabyid);
//---------------------end
//app.get('/users/permissions', userDetail.permission);
//app.get('/users/roles', userDetail.roles);
//app.get('/foreignExcRates', exchangeRates.listRates);
app.get('/foreignExcRates/list', exchangeRates.listExcRates);
///app.get('/redisconn', redisCon);
app.get('/diamondUploadfiles/getHistory', fileWatch.getPendingDiamonUploadFiles);
//app.post('/diamondUploadfiles/marketingFileupload', fileWatch.marketingFileupload);

/// ----------------------------- Email template api --------------------------------////
app.post('/users/emailTemplatesave', emailer.addEmailTemplate);
app.get('/users/emailTemplateedit', emailer.emailTemplateedit);
app.post('/users/emailTemplateupdate', emailer.emailTemplateupdate);
app.get('/users/emailTemplatedelete', emailer.emailTemplatedelete);
app.get('/users/emailTemplategetall', emailer.emailTemplategetall);

/// ------------------------------ Aws cognito api  links --------------------getuserbyEmail----- ///
app.post('/awsCognito/login', awsAuth.Login);
app.post('/awsCognito/register', awsAuth.RegisterUser);
app.post('/awsCognito/confirmRegister/:confirmationCode', awsAuth.ConfirmRegistrationCode);
app.post('/awsCognito/resendConfirmCode/:email', awsAuth.ResendCode);
app.post('/awsCognito/forgotPass/:email', awsAuth.ForgotPassword);
app.post('/awsCognito/confirmPassword', awsAuth.ConfirmPassword);
app.post('/awsCognito/changePassword', awsAuth.ChangePassword);
app.post('/awsCognito/deleteUsr', awsAuth.DeleteUser);
app.post('/users/socialRegister', userDetail.socialRegister);
/// ---------------------------- End ----------------------------------------///
///--------------------Diamond Watcher-------------///
//app.get('/users/getAlldiamond', fileWatch.getAlldiamond);
//app.post('/users/deletediamondbyid', fileWatch.delete_diamond);
////----
app.get('/diamond/getAlldiamond', diamondprocess.getAlldiamond);
app.post('/diamond/getTotalDiamonds', diamondprocess.getTotalDiamonds);
app.post('/diamond/getAlldiamonddemo', diamondprocess.getAlldiamonddemo);
app.post('/diamond/getAlldiamondAlluser', diamondprocess.getAlldiamondAlluser);
app.post('/diamond/deletediamondbyid', diamondprocess.delete_diamond);
app.post('/diamond/addnewDiamond', diamondprocess.addnewDiamond);
app.get('/diamond/getalldropdownValue', diamondprocess.getalldropdownValue);
app.post('/diamond/sendDiamondEmail', diamondprocess.sendDiamondEmail);
app.post('/diamond/getfiltredDiamond', diamondprocess.getfiltredDiamond);
app.post('/diamond/getsearchValue', diamondprocess.getsearchValue);
app.post('/diamond/getDiamondmappingData', diamondprocess.getDiamondmappingData);
app.post('/diamond/addDealerUploadedDiamondColumns', diamondprocess.addDealerUploadedDiamondColumns);
app.post('/diamond/getDealerUploadDiamondColumn', diamondprocess.getDealerUploadDiamondColumn);
app.post('/diamond/savemappedData', diamondprocess.savemappedData);
app.post('/diamond/getDealerDiamondmappingData', diamondprocess.getDealerDiamondmappingData);
app.post('/diamond/removeMapping', diamondprocess.removeMapping);
app.post('/diamond/getcolordiamond', diamondprocess.getcolordiamond);
app.post('/diamond/getlabiamond', diamondprocess.getlabiamond);
app.post('/diamond/diamondDownload', diamondprocess.diamondDownload);
app.post('/diamond/getAllDiamondExport', diamondprocess.getAllDiamondExport);
app.post('/diamond/getDiamondDashboard', diamondprocess.getDiamondDashboard);

app.post('/diamond/UploadFile', diamondprocess.UploadFile);


/// ---------------------------- End ----------------------------------------///

/// -------------------- Retailer ------------------------------
app.post('/diamond/ConnectedRetailer', diamondprocess.AllConnectedRetailers);
app.post('/diamond/RetailerPendingRequest', diamondprocess.AllRetailersRequest);
app.post('/diamond/AcceptRetailerRequeset', diamondprocess.AcceptRetailerRequeset);
app.post('/diamond/ChangeRetailerDiamondAccess', diamondprocess.ChangeRetailerDiamondAccess);
app.post('/diamond/RejectRetailerRequeset', diamondprocess.DeclineRetailerRequeset);
app.post('/diamond/getAllRetailer', diamondprocess.getAllRetailer);
app.post('/diamond/inviteretailerEmail', diamondprocess.inviteretailerEmail);
// ----------------------- End -------------------------------//
app.post('/diamond/getfileData', diamondprocess.getfileData);
/// -------------------- conversation ------------------------------
app.post('/diamond/getconversation', diamondprocess.getconversation);
app.post('/diamond/deleteconversation', diamondprocess.deleteconversation);
app.post('/diamond/getconversationDetail', diamondprocess.getconversationDetail);
app.post('/diamond/insertConversation', diamondprocess.insertConversation);

//-----------------------------Group Discount ----------------------
app.post('/diamond/insertRetailerGroupDiscount', diamondprocess.insertRetailerGroupDiscount);
app.post('/diamond/getAllRetailerGroupDiscount', diamondprocess.getAllRetailerGroupDiscount);
app.post('/diamond/getRetailerGroupDiscountValues', diamondprocess.getRetailerGroupDiscountValues);
app.post('/diamond/addRetailerGroupDiscount', diamondprocess.addRetailerGroupDiscount);
app.post('/diamond/getRetailerGroupDiscountData', diamondprocess.getRetailerGroupDiscountData);
app.post('/diamond/deleteRetailerGroupDiscountData', diamondprocess.deleteRetailerGroupDiscountData);

//------------------------JewelryProcess --------------------
//------------------------JewelryProcess --------------------
app.post('/jewelry/addDealerUploadedJewelryColumns', jewelryprocess.addDealerUploadedJewelryColumns);
app.post('/jewelry/getDealerUploadJewelryColumn', jewelryprocess.getDealerUploadJewelryColumn);
app.post('/jewelry/getJewelrymapping', jewelryprocess.getJewelrymapping);
app.post('/jewelry/savemappedjewelryData', jewelryprocess.savemappedjewelryData);
app.post('/jewelry/removeJewelryMapping', jewelryprocess.removeJewelryMapping);
app.post('/jewelry/addJewelleryManageCollection', jewelryprocess.addJewelleryManageCollection);
app.post('/jewelry/getAllJewelleryManageCollection', jewelryprocess.getAllJewelleryManageCollection);
app.post('/jewelry/getupdateJewelleryManageCollection', jewelryprocess.getupdateJewelleryManageCollection);
app.post('/jewelry/updateJewelleryManageCollection', jewelryprocess.updateJewelleryManageCollection);
app.post('/jewelry/deleteJewelleryManageCollection', jewelryprocess.deleteJewelleryManageCollection);
app.post('/jewelry/addJewelryProduct', jewelryprocess.addJewelryProduct);
app.post('/jewelry/allJewelryProduct', jewelryprocess.allJewelryProduct);
app.post('/jewelry/uploadRetailerList', jewelryprocess.uploadRetailerList);
app.post('/jewelry/getAllRetailerList', jewelryprocess.getAllRetailerList);
app.post('/jewelry/getAllRetailerListForUpdate', jewelryprocess.getAllRetailerListForUpdate);
app.post('/jewelry/updateRetailerList', jewelryprocess.updateRetailerList);
app.post('/jewelry/deleteRetailerLocator', jewelryprocess.deleteRetailerLocator);
app.post('/jewelry/allJewelleryMetalType', jewelryprocess.allJewelleryMetalType);
app.post('/jewelry/allJewelleryMetalColor', jewelryprocess.allJewelleryMetalColor);
app.post('/jewelry/allJewelleryCategory', jewelryprocess.allJewelleryCategory);
app.post('/jewelry/allJewelleryCollection', jewelryprocess.allJewelleryCollection);
app.post('/jewelry/addGroupList', jewelryprocess.addGroupList);
app.post('/jewelry/allGroupList', jewelryprocess.allGroupList);
app.post('/jewelry/getPerticularDiscountListForUpdate', jewelryprocess.getPerticularDiscountListForUpdate);
app.post('/jewelry/updateDiscountList', jewelryprocess.updateDiscountList);
app.post('/jewelry/DeleteDiscountList', jewelryprocess.DeleteDiscountList);
app.post('/jewelry/addRingBuilder', jewelryprocess.addRingBuilder);
app.post('/jewelry/getAllRetailer', jewelryprocess.getAllRingBuilderRetailerList);
//aniket
//app.post('/jewelry/getAllJewelry', jewelryprocess.getAllJewelry);
app.post('/jewelry/getParticularforUpdateJewelryProduct', jewelryprocess.getParticularforUpdateJewelryProduct);
app.post('/jewelry/updateJewelryProduct', jewelryprocess.updateJewelryProduct);
app.post('/jewelry/sendJewelryEmail', jewelryprocess.sendJewelryEmail);
app.post('/jewelry/allRingBuilderProduct', jewelryprocess.allRingBuilderProduct);
app.post('/jewelry/deleteJewelryProduct', jewelryprocess.deleteJewelryProduct);

//Dipal
app.post('/jewelry/getMyRetailer', jewelryprocess.getMyRetailer);
app.post('/jewelry/getAllRingBuilderRetailerList', jewelryprocess.getAllRingBuilderRetailerList);
app.post('/jewelry/getMyRingBuilderRetailerList', jewelryprocess.getMyRingBuilderRetailerList);
app.post('/jewelry/changejewelleryRetailerAccess', jewelryprocess.changejewelleryRetailerAccess);
app.post('/jewelry/changejewelleryRingBuilderRetailerAccess', jewelryprocess.changejewelleryRingBuilderRetailerAccess);
app.post('/jewelry/getjewelleryRetailerPendingRequest', jewelryprocess.getjewelleryRetailerPendingRequest);
app.post('/jewelry/getjewelleryRingBuilderRetailerPendingRequest', jewelryprocess.getjewelleryRingBuilderRetailerPendingRequest);
app.post('/jewelry/approvejewelleryRingBuilderRetailer', jewelryprocess.approvejewelleryRingBuilderRetailer);
app.post('/jewelry/rejectjewelleryRingBuilderRetailer', jewelryprocess.rejectjewelleryRingBuilderRetailer);
app.post('/jewelry/approvejewelleryRetailer', jewelryprocess.approvejewelleryRetailer);
app.post('/jewelry/rejectjewelleryRetailer', jewelryprocess.rejectjewelleryRetailer);
app.post('/jewelry/allJewelryProductAlluser', jewelryprocess.allJewelryProductAlluser);
//hardeep
app.post('/jewelry/getjewelrydashboardCounts', jewelryprocess.getjewelrydashboardCounts);
//end

//app.post('/jewelry/insertConversation', jewelryprocess.insertConversation);

//app.post('/jewelry/addJewelryProduct', jewelryprocess.addJewelryProduct);
// catch 404 and forward to error handler
//app.use(function (req, res, next) {
//    var err = new Error('Not Found');
//    err.status = 404;
//	console.log(err);
//    next(err);
//});

// error handlers

// development error handler
// will print stacktrace

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/upload', multipartMiddleware2, (req, res) => {
    //console.log(req);
    console.log(req.files.uploads);
    var str = req.files.uploads[0].path;
    var str2 = str.split("\\");
    var str3 = str2[1];
    var dealerid = req.body.dealerid[0];
    client.execute("insert into key_gemfind.marketingFileUpload (pk_id,filename,dealerid) values (now(),'" + req.files.uploads[0].originalFilename + "'," + dealerid + ")", [], function (err, result) {
        if (err) {
            console.log('users: list err:', err);
            res.status(404).send({ msg: err });
        } else {
            console.log('users: list succ:', err);
            if (!fs.existsSync('C:/Hardeep/gemfind/NodeAPI/Marketing Documents/' + req.body.foldername[0])) {
                fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/Marketing Documents/' + req.body.foldername[0]);
            };
            fs.rename('C:/Hardeep/gemfind/NodeAPI/Marketing Documents/' + str2[5], 'C:/Hardeep/gemfind/NodeAPI/Marketing Documents/' + req.body.foldername[0] +'/'+ req.files.uploads[0].originalFilename, function (err) {
                        if (err) {
                            console.log('File Rename Fail');
                        }
                        else {
                            res.send({ status: 200, data: 'File Uploaded And Moved' });
                        }
              });
            //fs.move('C:/Hardeep/gemfind/NodeAPI/uploads/' + str2[5], 'C:/Hardeep/gemfind/NodeAPI/uploads/' + dealerid + '/' + req.files.uploads[0].originalFilename, function (err) {
            //    if (err) {
            //        res.send({ status: 400, data: 'Alredy Exist' });
            //        fs.unlink('C:/Hardeep/gemfind/NodeAPI/uploads/' + str2[5], (err) => {
            //            if (err) throw err;
            //            console.log('path/file.txt was deleted');
            //        });
            //    }
            //    else {
            //        res.send({ status: 200, data: 'File Uploaded And Moved' });
            //    }
            //});
        }
    });
});
app.post('/api/uploadProfile', multipartMiddleware, (req, res) => {
    var input = req.body;
    var dealerid = input.dealerid[0];
    var str = req.files.uploads[0].path;
    var str2 = str.split("\\");
    var str3 = str2[1];
    if (!fs.existsSync('C:/Hardeep/gemfind/NodeAPI/UploadedContent/' + input.dealerid[0])) {
        fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/UploadedContent/' + input.dealerid[0]);
    };
    fs.rename('C:/Hardeep/gemfind/NodeAPI/UploadedContent/' + str2[5], 'C:/Hardeep/gemfind/NodeAPI/UploadedContent/' + dealerid + '/' + req.files.uploads[0].originalFilename, function (err) {
        if (err) {
            console.log('File Rename Fail');
        }
        else {
            client.execute("UPDATE key_gemfind.user_registration set image_name='" + req.files.uploads[0].originalFilename + "' WHERE pk_id = " + input.pk_id[0], [], function (err, result) {
                if (err) {
                    console.log('users: list err:', err);
                    res.status(404).send({ msg: err });
                } else {
                    console.log('users: list succ:', err);
                    res.send({ status: 200, data: req.files.uploads[0].originalFilename});
                }
            });
            
        }
    });
   
});
 

app.post('/api/diamondupload', function (req, res) {
    
    upload(req, res, function (err) {
        
        console.log(req.body.dealer_id);
        console.log(req.body.upload_type);
       
        res.send({ status: 200, data: null });
        
    });
});


if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});


var storage = multer.diskStorage({ //multers disk storage settings     
    
    destination: function (req, file, cb) {        
        cb(null, './uploads/' + req.body.dealer_id);
    },
    filename: function (req, file, cb) {
        //-------- insert into database -------------------///
        var dealerId = req.body.dealer_id;
        var uploadType = req.body.upload_type;
        var fileName = req.body.file_name;        
        var uploadFilePath = "F:\\Nayan\\API_Jewelcloud\\uploads\\" + dealerId + "\\" + fileName;
        var query = "INSERT INTO key_gemfind.diamondFileUpload (pk_id, created_date, created_time, file_name,file_path,file_type,file_extension,upload_type,status,companyId,updated_date,log,isfileupload) VALUES (now(),'" + new Date().toJSON().slice(0, 10) + "',toTimeStamp(now()), '" + fileName + "',  '" + uploadFilePath.trim() + "', '" + uploadType + "','" + fileName.split('.')[1] + "' , 'system', 'pending', '" + dealerId + "',toTimeStamp(now()),'',false)";
        console.log(query);
        common.queryCassandra(query);

        ////-------------- add file in folder ---------------------//
        var datetimestamp = Date.now();
        cb(null,  file.originalname); //file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('file');

app.post('/api/Imgupload', multipartMiddleware2, (req, res) => {
    //console.log(req);
    var input = req.body;
    //var str = req.files.uploads[0].path;
    //var str2 = str.split("\\");
    //var str3 = str2[1];
    console.log(str3);
    console.log(req.files.uploads);
    var dealerId = req.body.dealerid[0];
    var fileName = req.files.uploads[0].originalFilename;
    var uploadFilePath = "F:\\Nayan\\API_Jewelcloud\\uploads\\" + dealerId + "\\" + fileName;

    console.log('users: list succ:');
    if (!fs.existsSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + dealerId)) {
        fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + dealerId);
    }
    for (var k = 0; k < req.files.uploads.length; k++) {
        var str = req.files.uploads[k].path;
        var str2 = str.split("\\");
        var str3 = str2[1];
        var srcPath = 'C:/Hardeep/gemfind/NodeAPI/uploads/root/' + str2[6];
        if (!fs.existsSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 1050) || !fs.existsSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 750) || !fs.existsSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 350)) {

            fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 1050);
            fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 750);
            fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 350);
        }



        var destPath1 = 'C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 1050 + '/' + req.files.uploads[k].originalFilename;
        var destPath2 = 'C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 750 + '/' + req.files.uploads[k].originalFilename;
        var destPath3 = 'C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 350 + '/' + req.files.uploads[k].originalFilename;


        //  For 1050*1050
        sharp(srcPath).resize({ height: 1050, width: 1050 }).toFile(destPath1)
            .then(function (newFileInfo) {
                console.log("Success");
            })
            .catch(function (err) {
                console.log("Error occured");
            });

        //  For 750*750  
        sharp(srcPath).resize({ height: 750, width: 750 }).toFile(destPath2)
            .then(function (newFileInfo) {
                console.log("Success");
            })
            .catch(function (err) {
                console.log("Error occured");
            });

        //  For 350*350  
        sharp(srcPath).resize({ height: 350, width: 350 }).toFile(destPath3)
            .then(function (newFileInfo) {
                console.log("Success");
            })
            .catch(function (err) {
                console.log("Error occured");
            });


        //fs.rename(srcPath, destPath, function (err) {
        //    if (err) {
        //        console.log('File Rename Fail');
        //    }
        //    else {
        //        //res.send({ status: 200, data: 'File Uploaded And Moved' });
        //    }
        //});
    }


    res.send({ status: 200, data: 'File Uploaded And Moved' });



});


app.post('/api/zipUpload', multipartMiddleware2, (req, res) => {

    req.headers["content-type"] = 'text/xml';
    var dealerId = req.body.dealerid[0];
    var fileName = req.files.uploads[0].originalFilename;


    try {
        for (var k = 0; k < req.files.uploads.length; k++) {

            var str = req.files.uploads[k].path;
            var str2 = str.split("\\");


            var dirPath = 'C:/Hardeep/gemfind/NodeAPI/uploads/root/' + str2[5];
            var destPath = 'C:/Hardeep/gemfind/NodeAPI/uploads/';


            fs.createReadStream(dirPath).pipe(unzip.Extract({ path: destPath }));

            //extract(dirPath, { dir: destPath }, function (err) {
            //    // extraction is complete. make sure to handle the err
            //})


        }
    } catch (e) {
        debugger;

    }

    //-----------this is for upload in separate folder-------------------

    var final = 'C:/Hardeep/gemfind/NodeAPI/uploads/' + fileName;
    var st = final.split(".");
    var finalsdes = st[0];

    fs.readdir(finalsdes, function (err, files) {

        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }



        for (var l = 0; l < files.length; l++) {

            var newfile = finalsdes + '/' + files[l];
            if (!fs.existsSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 1050) || !fs.existsSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 750) || !fs.existsSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 350)) {

                fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 1050);
                fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 750);
                fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 350);
            }


            // var resigeImg = newfile;
            var destPath1 = 'C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 1050 + '/' + files[l];
            var destPath2 = 'C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 750 + '/' + files[l];
            var destPath3 = 'C:/Hardeep/gemfind/NodeAPI/uploads/' + req.body.dealerid[0] + '/' + 350 + '/' + files[l];


            //  For 1050*1050
            sharp(newfile).resize({ height: 1050, width: 1050 }).toFile(destPath1)
                .then(function (newFileInfo) {
                    console.log("Success");
                })
                .catch(function (err) {
                    console.log(err);
                });

            //  For 750*750  
            sharp(newfile).resize({ height: 750, width: 750 }).toFile(destPath2)
                .then(function (newFileInfo) {
                    console.log("Success");
                })
                .catch(function (err) {
                    console.log("Error occured");
                });

            ////  For 350*350  
            sharp(newfile).resize({ height: 350, width: 350 }).toFile(destPath3)
                .then(function (newFileInfo) {
                    console.log("Success");
                })
                .catch(function (err) {
                    console.log("Error occured");
                });

        }

        // console.log(file);

    });




    res.send({ status: 200, data: 'File Uploaded And Moved' });




});


//-------Aniket     20/11/2019      -----------------------

app.post('/api/collectionImgUpload', multipartMiddleware2, (req, res) => {
    //console.log(req);
    var input = req.body;
    var str = req.files.uploads[0].path;
    var str2 = str.split("\\");
    var str3 = str2[1];
    var str4 = str[6];
    console.log(str3);
    console.log(req.files.uploads);
    var dealerId = req.body.dealerid[0];
    var collectionName = req.body.collectionName[0];
    var fileName = req.files.uploads[0].originalFilename;
    var changeName = fileName.split(".");
    var change1 = changeName[1];
    console.log('users: list succ:');
    if (!fs.existsSync('C:/Hardeep/gemfind/NodeAPI/uploads/Collection/' + dealerId)) {
        fs.mkdirSync('C:/Hardeep/gemfind/NodeAPI/uploads/Collection/' + dealerId);
    }
    fs.rename('C:/Hardeep/gemfind/NodeAPI/uploads/root/' + str2[6], 'C:/Hardeep/gemfind/NodeAPI/uploads/Collection/' + dealerId + '/' + collectionName + '.jpg', function (err) {
        if (err) {
            console.log('File Rename Fail');
            console.log('users: list err:', err);
            res.status(404).send({ msg: err });
        }
        else {
            console.log('users: list succ:', err);
            res.send({ status: 200, data: 'File Uploaded And Moved' });
            //res.send({ status: 200, data: req.files.uploads[0].originalFilename });           
        }
    });
    
});
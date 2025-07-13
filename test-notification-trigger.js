"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var Config_1 = require("./constants/Config");
var supabase = (0, supabase_js_1.createClient)(Config_1.Config.SUPABASE.URL, Config_1.Config.SUPABASE.ANON_KEY);
function testNotificationTrigger() {
    return __awaiter(this, void 0, void 0, function () {
        var testDevice, _a, userPref, userError, testArticle, _b, article, articleError, testTranslation, _c, translation, translationError, error_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 6, , 7]);
                    testDevice = {
                        device_id: 'test_device_' + Date.now(),
                        push_token: 'ExponentPushToken[test_token]',
                        notifications_enabled: true,
                        language_code: 'en'
                    };
                    console.log('Creating test user preferences...');
                    return [4 /*yield*/, supabase
                            .from('user_preferences')
                            .upsert(testDevice)
                            .select()
                            .single()];
                case 1:
                    _a = _d.sent(), userPref = _a.data, userError = _a.error;
                    if (userError) {
                        throw new Error("Failed to create test user: ".concat(userError.message));
                    }
                    console.log('Test user created:', userPref);
                    testArticle = {
                        location: 'Singapore',
                        source_channel: 'Test Channel',
                        title: 'Test Article',
                        article_url: 'https://example.com/test',
                        description: 'This is a test article',
                        published_at: new Date().toISOString(),
                        category: 'test'
                    };
                    console.log('Creating test article...');
                    return [4 /*yield*/, supabase
                            .from('news_article')
                            .insert(testArticle)
                            .select()
                            .single()];
                case 2:
                    _b = _d.sent(), article = _b.data, articleError = _b.error;
                    if (articleError) {
                        throw new Error("Failed to create test article: ".concat(articleError.message));
                    }
                    console.log('Test article created:', article);
                    testTranslation = {
                        article_id: article.id,
                        language_code: 'en',
                        title: 'Test Article Translation',
                        description: 'This is a test article translation',
                        published_at: new Date().toISOString()
                    };
                    console.log('Creating test translation...');
                    return [4 /*yield*/, supabase
                            .from('news_article_translation')
                            .insert(testTranslation)
                            .select()
                            .single()];
                case 3:
                    _c = _d.sent(), translation = _c.data, translationError = _c.error;
                    if (translationError) {
                        throw new Error("Failed to create test translation: ".concat(translationError.message));
                    }
                    console.log('Test translation created:', translation);
                    // 4. Wait a bit to allow the trigger to process
                    console.log('Waiting for trigger to process...');
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 4:
                    _d.sent();
                    // 5. Clean up test data
                    console.log('Cleaning up test data...');
                    return [4 /*yield*/, Promise.all([
                            supabase.from('user_preferences').delete().eq('device_id', testDevice.device_id),
                            supabase.from('news_article').delete().eq('id', article.id)
                        ])];
                case 5:
                    _d.sent();
                    console.log('Test completed successfully!');
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _d.sent();
                    console.error('Test failed:', error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testNotificationTrigger();

/**
 * @NApiVersion 2.x
 * @NScriptType restlet
 */

/**
 * @Details: This script is to process HTTP calls from BOOMI.
 * Based on action parameter, different modules are loaded to return data back to BOOMI
 *
 * Developed in modular design and single responsibility principle
 */


/**
 * ACTION REFERENCE (Boomi Processes)
 * 1: NS Pricing Matrix to BMI
 * 2: NS Items to BMI
 * 3: NS Item Fulfillment Record to SalesForce
 */

const CONST_ACTION = {
    MULTI_ALLOCATION_PRICE: '1',
    ITEMS: '2',
    ITEM_FM_TO_SF: '3',
    POST_UPDATE_ITEM_FM: '4',
    TRACKING_CODE: '5'
};

define(['N/record', 'N/error', 'N/search',
        './lib/Agilysys_LIB_MAP', './lib/Agilysys_LIB_NS_ITEMS', './lib/Agilysys_NS_FM_SF',
        '/lib/Agilysys_LIB_Tracking_Code'],
    function(record, error, search, ag, ag2, ag3, trackCodeSync) {

    var exports = {};

    var _get = function(context) {

        // Define all GET method here.
       var output = {};
       if(!context.hasOwnProperty('action')) {
           return error.create({
               name: 'MISSING_REQ_ARG',
               message: 'Missing a required argument internal ID'
           });
       }
       var vertitalId = context.verticalId || '';
       var lastModified = context.lastModified || '';

       log.debug({
           "title": "Get Parameters",
           "details": 'lastModified = ' + lastModified + '\n'
                        + 'action = ' + context.action
       });

       // if action is 1
       if(context.action == CONST_ACTION.MULTI_ALLOCATION_PRICE) {
           output = ag.getPricingDataByVertical(vertitalId, lastModified);
       }
       // if action is 2
       else if(context.action == CONST_ACTION.ITEMS) {
           output = ag2.getItemData(lastModified);
       }
       // if action is 3
       else if(context.action == CONST_ACTION.ITEM_FM_TO_SF) {
           output = ag3.getFulfillmentData(lastModified);
       }
       // if actions is 5
       else if(context.action == CONST_ACTION.TRACKING_CODE) {
           output = trackCodeSync.exportTrackingCode(lastModified);
       }

       if(context.hasOwnProperty('id')){
           log.debug({
               title: "GET",
               details: "ID: " + context.id
           });
           var lookupOptions = {
               type: search.Type.ITEM,
               id: context.id,
               columns: 'type'
           };
           var itemTypeObj = search.lookupFields(lookupOptions);
           log.debug({
               title: 'ITEM LOOKUP',
               details: itemTypeObj
           });

           output.itemType = itemTypeObj ;

       }

       return JSON.stringify(output);
   };


    // Define all POST method here
   var _post = function(requestBody) {
       log.debug({
           title: 'requestBody',
           details: requestBody
       });

       // initializing response to return
       var response = {
           status: '',
           details: ''
       };

       if(requestBody.hasOwnProperty("Action")) {

           if(requestBody.Action == CONST_ACTION.POST_UPDATE_ITEM_FM) {
               // action is 4

               var netSuiteId = requestBody.NetSuite_ID;
               var salesForceId = requestBody.SF_ID;

               try {
                   var recordId = record.submitFields({
                       type: record.Type.ITEM_FULFILLMENT,
                       id: netSuiteId,
                       values: {
                           externalid: salesForceId
                       }
                   });
               } catch(e) {
                   response.status = 'fail';
                   response.details = e.details;
               }

               if(response.status == '') {
                   response.status = 'success';
                   response.details = recordId;
               }
           }

       } else {
           return JSON.stringify({
               "status": "fail",
               "details": "Missing required field 'Action'."
           });
       }

       return response;
   };

   exports.get = _get;
   exports.post = _post;
   return exports;
});


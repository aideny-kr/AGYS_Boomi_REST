/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/record'], function(search, record) {
   var exports = {};

   var getFulfillmentData = function(lastModified) {

       // initialization
       var dataOut = [];

       var itemfulfillmentSearchObj = search.create({
           type: "itemfulfillment",
           filters: [
               ["type","anyof","ItemShip"],
               "AND",
               ["status","anyof","ItemShip:C"],
               "AND",
               ["lastmodifieddate","onorafter",lastModified],
               "AND",
               ["custbody_ag_opp_number","noneof","@NONE@"],
               "AND",
               ["mainline","is","T"],
               "AND",
               ["createdfrom.type","anyof","SalesOrd"],
               "AND",
               ["type","anyof","ItemShip"],
               "AND",
               ["createdfrom.opportunity","noneof","@NONE@"],
               "AND",
               ["trandate","within","10/1/2016","10/15/2016"]
           ],
           columns: [
               search.createColumn({
                   name: "custrecord_opportunity",
                   join: "CUSTBODY_AG_OPP_NUMBER"
               }),
               search.createColumn({
                   name: "trandate"
               }),
               search.createColumn({
                   name: "tranid",
                   join: "createdFrom"
               }),
               search.createColumn({
                   name: "opportunity",
                   join: "createdFrom"
               }),
               search.createColumn({
                   name: "createdfrom",
                   join: "createdFrom"
               }),
               "custbody_ag_shipping_carrier",
               "custbody_ag_shipping_method",
               "lastmodifieddate",
               "externalid"
           ]
       });

       itemfulfillmentSearchObj.run().each(function(result) {

           // Building Header Level Object
           var tempObj = {};
           tempObj["fulfillment_ns_id"] = result.id;

           result.columns.forEach(function(column){

               // different logic for different column names
               switch(column.name) {
                   case 'createdfrom':
                       // Quote
                       var quoteTranId = search.lookupFields({
                           type: search.Type.ESTIMATE,
                           id: result.getValue({ name: column.name, join: column.join}),
                           columns: "tranid"
                       }).tranid;

                       tempObj["quote_tran_id"] = quoteTranId;
                       break;

                   case 'opportunity':
                       // Opportunity
                       // Get externalId (SalesForce ID) and Tran ID
                       var opportunityLookup = search.lookupFields({
                           type: search.Type.OPPORTUNITY,
                           id: result.getValue({ name: column.name, join: column.join}),
                           columns: ["tranid", "externalid"]
                       });
                       var sfObjectId;

                       if(opportunityLookup.externalid[0]) {
                           sfObjectId = opportunityLookup.externalid[0].value;
                       }

                       var oppTranId = opportunityLookup.tranid;
                       tempObj["opp_tran_id"] = oppTranId;

                       // this will be salesforce internalid
                       tempObj["sf_object_id"] = sfObjectId;
                       break;

                   case 'custbody_ag_shipping_carrier':
                       tempObj['shipping_carrier'] = result.getText({ name: column.name });
                       break;

                   case 'custbody_ag_shipping_method':
                       tempObj['shipping_method'] = result.getText({ name: column.name });
                       break;

                   default:
                       tempObj[column.name] = result.getValue({ name: column.name, join: column.join});

               };

           });

           // build line level item object and push
           // SF needs Item Number, Item Name, Unit of Measure, Quantity Shipped, Currency, NS Package ID
           if(tempObj["sf_object_id"] && tempObj["sf_object_id"].indexOf('006q') > -1 ) {
               // if externalid is missing in opportunity, no need to process

               log.debug({
                   title: 'Inside Line Search',
                   details: 'External ID: ' + tempObj["sf_object_id"]
               });

               var lineSearchResult = searchLineItems(result.id);

               if(lineSearchResult) {
                   // up to 4,000 result

                   tempObj['item_lines'] = [];
                   lineSearchResult.run().each(function(result) {

                       tempLineObj = {};
                       result.columns.forEach(function(column){
                           if(column.name == 'item') {
                               tempLineObj[column.name] = result.getText({ name: column.name, join: column.join  });
                           } else {
                               tempLineObj[column.name] = result.getValue({ name: column.name, join: column.join  });
                           }

                       });

                       tempObj['item_lines'].push(tempLineObj);
                       return true;
                   });
               }

               // build dataOut arrays
               dataOut.push(tempObj);
           }

           return true;
       });

        return dataOut;
   };

   var searchLineItems = function(id) {
       var itemfulfillmentLineSearchObj = search.create({
           type: "itemfulfillment",
           filters: [
               ["type","anyof","ItemShip"],
               "AND",
               ["internalidnumber","equalto",id],
               "AND",
               ["cogs","is","F"],
               "AND",
               ["type","anyof","ItemShip"]
           ],
           columns: [
               "item",
               search.createColumn({
                   name: "salesdescription",
                   join: "item"
               }),
               "quantity",
               "line"
           ]
       });

       return itemfulfillmentLineSearchObj;
   };

   exports.getFulfillmentData = getFulfillmentData;
   return exports;
});

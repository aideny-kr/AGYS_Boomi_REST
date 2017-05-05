/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

// Action 5

define(['N/search'], function(search) {

    var exports = {};

    var exportTrackingCode = function(lastModified) {

        // fallback date
        var lastModified = lastModified || "5/1/2017 12:00 am";
        var dataOut = [];
        var itemfulfillmentSearchObj = search.create({
            type: "itemfulfillment",
            filters: [
                ["type","anyof","ItemShip"],
                "AND",
                ["externalid","noneof","@NONE@"],
                "AND",
                ["mainline","is","T"],
                "AND",
                ["trackingnumber","isnotempty",""],
                "AND",
                ["lastmodifieddate","onorafter", lastModified]
            ],
            columns: [
                search.createColumn({
                    name: "trandate",
                    sort: search.Sort.ASC
                }),
                "entity",
                "trackingnumbers",
                "externalid"
            ]
        });
        var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
        itemfulfillmentSearchObj.run().each(function(result){
            var tempObj = {};
            // .run().each has a limit of 4,000 results
            var trackingCode = result.getValue({ name: 'trackingnumbers' });
            var externalId = result.getValue({ name: 'externalid' });
            if(trackingCode && externalId) {
                tempObj['tracking_code'] = trackingCode;
                tempObj['sf_object_id'] = externalId;
            }

            if(tempObj.hasOwnProperty('sf_object_id')) {
                dataOut.push(tempObj);
            }

            return true;
        });

        return dataOut;

    }

    exports.exportTrackingCode = exportTrackingCode;
    return exports;

});

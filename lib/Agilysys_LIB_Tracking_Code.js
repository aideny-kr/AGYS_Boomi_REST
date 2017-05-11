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
                "externalid",
                "tranid"
            ]
        });
        var searchResultCount = itemfulfillmentSearchObj.runPaged().count;

        log.audit({
            title: 'Returned Results Length',
            details: searchResultCount
        });

        itemfulfillmentSearchObj.run().each(function(result){

            // .run().each has a limit of 4,000 results
            var trackingCode = result.getValue({ name: 'trackingnumbers' });
            var externalId = result.getValue({ name: 'externalid' });
            var nsTranId = result.getValue({ name: 'tranid' });
            if(trackingCode && externalId) {

                var trackingCodes = trackingCode.split('<BR>');

                for(var i = 0; i < trackingCodes.length; i++) {
                    var tempObj = {};
                    tempObj['ns_tran_jd'] = nsTranId;
                    tempObj['sf_object_id'] = externalId;
                    tempObj['trackingnumber'] = trackingCodes[i];

                    dataOut.push(tempObj);
                }

            }

            return true;
        });

        return dataOut;

    }

    exports.exportTrackingCode = exportTrackingCode;
    return exports;

});

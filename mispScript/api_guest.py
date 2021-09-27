#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pymisp import ExpandedPyMISP
from keys_guest import misp_url, misp_key,misp_verifycert
from datetime import datetime
import argparse
import os
import json


def init(url, key):
        return PyMISP(url, key, False, 'json')

if __name__ == '__main__':
        parser = argparse.ArgumentParser(description='Get all the events matching a value for a given param.')
        parser.add_argument("-l", "--list", required=False, action='store_true', help="List recent events with info.")
        parser.add_argument("-p", "--page", required=False, type=int, help="Pagination of results.")
        parser.add_argument("-m", "--limit", required=False, type=int, help="Limit results per page.")
        parser.add_argument("-s", "--search", required=False, action='store_true', help="Limit results per page.")
        parser.add_argument("-d", "--id", required=False, help="Limit results per page.")

        args = parser.parse_args()

#        print(misp_url)
#        print(misp_key)

        misp = ExpandedPyMISP(misp_url, misp_key)

        flag_action = 0

        if args.list is not False:

                relative_path = 'events/index/sort:id/direction:desc'

                if args.page is not None and args.limit is not None:

                        if args.limit > 60:
                                args.limit = 60

                        body = '{"returnFormat":"csv","page":"' + str(args.page) + '","limit":"' + str(args.limit) + '","requested_attributes":["object_relation","value"]}'

                        result = misp.direct_call(relative_path, body)

                        if not result:
                                print('No results.')
                                exit(0)
                        else:
                                r_ids = []
                                for r in result:
                                        r_ids.append(r['id'])
                                result = misp.search(eventid=r_ids)
                                print("eventid,cve")
                                for r in reversed(result):
                                        print(r['Event']['id'] + "," + r['Event']['Object'][0]['Attribute'][0]['value'])
                                
                else:
                        print("Usage: python3 search.py -l -p <page #> -m <limit results #>")
                        print("Please define the page/limitation of interest.")
                flag_action = 1

        if args.search is not False and flag_action == 0:

                        rel_events = []
                        rel_events_ids = []
                        timestamp = 1545730073
                        dt_object = datetime.fromtimestamp(timestamp)
                        cve_id = ''
                        vuln_confs = []
                        pubtime = ''
                        description = ''
                        modtime = ''
                        cvss_score = 0.0
                        cvss_str = ''
                        refs = []
                        summary = ''
                        credit = ''

                        if args.id is not None:
                                result = misp.search(eventid=args.id)

                                if not result:
                                        print('No results.')
                                        exit(0)
                                else:
                                        print(json.loads(json.dumps(result)));
                                        exit(0);
                                        for r in reversed(result):
                                                rel_events = r['Event']['RelatedEvent']
                                                for r2 in rel_events:
                                                        rel_events_ids.append(r2['Event']['id'])
                                                rel_events_ids = reversed(rel_events_ids)
                                                dt_object = datetime.fromtimestamp(int(r['Event']['Object'][0]['timestamp']))
                                                for att in r['Event']['Object'][0]['Attribute']:
                                                        if att['object_relation'] == 'id':
                                                                cve_id = att['value']
                                                        if att['object_relation'] == 'vulnerable_configuration':
                                                                vuln_confs.append(att['value'])
                                                        if att['object_relation'] == 'published':
                                                                pubtime = att['value']
                                                        if att['object_relation'] == 'description':
                                                                description = att['value']
                                                        if att['object_relation'] == 'modified':
                                                                modtime = att['value']
                                                        if att['object_relation'] == 'cvss-score':
                                                                cvss_score = att['value']
                                                        if att['object_relation'] == 'cvss-string':
                                                                cvss_str = att['value']
                                                        if att['object_relation'] == 'references':
                                                                refs.append(att['value'])
                                                        if att['object_relation'] == 'summary':
                                                                summary = att['value']
                                                        if att['object_relation'] == 'credit':
                                                                credit = att['value']
                                #print("+-------Event Info-------+")
                                scatola = {};
                                scatola["CVE"] = cve_id
                                #scatola["EventDatetime"] =dt_object
                                scatola["RelatedEventsIDs"] = {}
                                for r in rel_events_ids:
                                    scatola["RelatedEventsIDs"][r] = 1
                                scatola["Summary"] = summary
                                scatola["PublicationDatetime"] = pubtime
                                scatola["LastModificationDatetime"] = modtime
                                scatola["CVSSstring"] = cvss_str
                                scatola["CVSSscore"] = cvss_score
                                scatola["VulnerableConfigurations"] = {};
                                for vc in vuln_confs:
                                        scatola["VulnerableConfigurations"][vc] = 1;
                                scatola["References"] = {}
                                for r in refs:
                                        scatola["References"][r] =1
                                scatola["CreditSource"] = credit
                                scatola["Description"]= description
                                scatola2 = json.dumps(scatola)
                                print(scatola2);

                                #print("CVE:",cve_id)
                                #print("Event datetime:",dt_object)
                                #print("Related Events IDs:")
                                #for r in rel_events_ids:
                                        #print("\t",r)
                                #print("Summary:",summary)
                                #print("Publication datetime:",pubtime)
                                #print("Last modification datetime:",modtime)
                                #print("CVSS string:",cvss_str)
                                #print("CVSS score:",cvss_score)
                                #print("Vulnerable Configurations:")
                                #for vc in vuln_confs:
                                        #print("\t",vc)
                                #print("References:")
                                #for r in refs:
                                        #print("\t",r)
                                #print("Credit/Source:",credit)
                                #print("")
                                #print("")
                                #print("Description:")
                                #print(description)
                                #print("+------------------------+")
                        else:
                                print("Usage: python3 search.py -s -d <event ID>")
                                print("Please define the event ID of interest.")
                        flag_action = 1


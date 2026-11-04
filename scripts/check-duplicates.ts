// Dev-only script: checks the name, phone and location matching helpers with a few known cases.
// Run with: npm run dup:check

import { nameSimilarity, normalizePhone, overlappingProperty, sameLocation } from "@/lib/duplicates";

let failed = 0;
function check(label: string, passed: boolean) {
  console.log(`${passed ? "ok  " : "FAIL"} ${label}`);
  if (!passed) failed++;
}

check("phone formats match", normalizePhone("+91 98450 12345") === normalizePhone("09845012345"));
check("same name", nameSimilarity("Priya Nair", "priya nair") === 1);
check("title ignored", nameSimilarity("Mr. Rahul Kumar", "Rahul Kumar") === 1);
check("word order ignored", nameSimilarity("Kumar Rahul", "Rahul Kumar") === 1);
check("short form matches", nameSimilarity("Rahul K", "Rahul Kumar") >= 0.8);
check("typo matches", nameSimilarity("Priya Nayar", "Priya Nair") >= 0.8);
check("same first name, different surname does not match", nameSimilarity("Priya Nair", "Priya Sharma") < 0.8);
check("different people do not match", nameSimilarity("Amit Shah", "Meera Joshi") < 0.8);
check("same area", sameLocation("Whitefield, Bengaluru", "whitefield"));
check("different area", !sameLocation("Whitefield, Bengaluru", "Hinjewadi, Pune"));
check("2BHK variants overlap", overlappingProperty("2BHK in Whitefield", "2 bhk flat near ITPL"));
check("different property", !overlappingProperty("2 BHK flat", "NA plot, 5000 sq ft"));

process.exit(failed === 0 ? 0 : 1);

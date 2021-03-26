export default [
  {id:"firstName", label:"First Name"},
  {id:"middleName", label:"Middle Name"},
  {id:"lastName", label:"Last Name"},
  {id:"ssn", label:"SSN", validation:"ssn", mask:"###-##-####"},
  {id:"phone", label:"Phone", validation:"phone"},
  {id:"email", label:"Email", validation:"email", fieldType:'email'},
  {id:"fax", label:"Fax", validation:"phone"},
  {id:"textPhone", label:"Mobile Phone", validation:"phone"},
  {id:"attn", label:"Attn"},
  {id:"streetAddress", label:"Street Address"},
  {id:"city", label:"City"},
  {id:"stateOrProvince", label:"State or Province", options:'statelist', fieldType:"state"},
  {id:"zipOrPostalCode", label:"Zip or Postal Code"},
  {id:"country", label:"Country", default:'USA'},
  {id:"dateOfBirth", label:"Date of Birth", mask:"##/##/####"},
  {id:"gender", label:"Gender", options:['Male', 'Female', 'Non-binary']},
  {id:"preferredContactMethod", label:"Preferred Contact Method", options:['Phone', 'Mobile', 'Email']},
  {id:"language", label:"Language", options:["English", "Spanish"], default:'English'}
]
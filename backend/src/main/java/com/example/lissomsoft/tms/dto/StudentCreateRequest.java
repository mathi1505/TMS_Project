package com.example.lissomsoft.tms.dto;


import com.example.lissomsoft.tms.entity.StudentMaster;
import lombok.Data;

@Data
public class StudentCreateRequest {

    private String typeCode; // INT / TRI

    private StudentMaster student;
}